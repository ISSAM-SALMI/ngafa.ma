from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.http import HttpResponse
from .models import (
    Client, SalonService, SalonVisit, Dress, DressRental,
    NgafaItem, NgafaEvent, NgafaBookingItem
)
from .serializers import (
    UserSerializer, ClientSerializer, SalonServiceSerializer, SalonVisitSerializer,
    DressSerializer, DressRentalSerializer, NgafaItemSerializer, NgafaEventSerializer,
    NgafaBookingItemSerializer
)

import os
import urllib.request
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
import arabic_reshaper
from bidi.algorithm import get_display
from django.conf import settings

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

class SalonServiceViewSet(viewsets.ModelViewSet):
    queryset = SalonService.objects.all()
    serializer_class = SalonServiceSerializer

class SalonVisitViewSet(viewsets.ModelViewSet):
    queryset = SalonVisit.objects.all()
    serializer_class = SalonVisitSerializer

class DressViewSet(viewsets.ModelViewSet):
    queryset = Dress.objects.all()
    serializer_class = DressSerializer

class DressRentalViewSet(viewsets.ModelViewSet):
    queryset = DressRental.objects.all()
    serializer_class = DressRentalSerializer

class NgafaItemViewSet(viewsets.ModelViewSet):
    queryset = NgafaItem.objects.all()
    serializer_class = NgafaItemSerializer

class NgafaEventViewSet(viewsets.ModelViewSet):
    queryset = NgafaEvent.objects.all()
    serializer_class = NgafaEventSerializer

class NgafaBookingItemViewSet(viewsets.ModelViewSet):
    queryset = NgafaBookingItem.objects.all()
    serializer_class = NgafaBookingItemSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_contract_pdf(request, pk):
    try:
        event = NgafaEvent.objects.get(pk=pk)
    except NgafaEvent.DoesNotExist:
        return Response({'error': 'Event not found'}, status=404)

    client = event.client
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="contract_{event.id}.pdf"'
    
    items = event.ngafabookingitem_set.all()
    # Calculate sum if needed or rely on generate_pdf to sum per row? 
    # generate_pdf takes total_amount to display at bottom.
    # We should calculate it here to ensure accuracy.
    total = sum(item.quantity * item.price_at_booking for item in items)
    
    terms = [
        "1. يتم تحديد توقيت التنكاف مسبقًا وبالاتفاق مع الزبونة، وأي تغيير في الوقت يجب إبلاغنا به قبل المناسبة بمدة كافية.",
        "2. جميع مصاريف التنقل، المعدات، والطاقم (الخدامين) تكون على عاتق الزبونة بشكل كامل.",
        "3. لا تتحمل الجهة المقدمة للخدمة أي تأخير ناتج عن ظروف خارجة عن إرادتها (ازدحام، ظروف مناخية، تأخر الزبونة...).",
        "4. في حال حدوث أي ضرر للمعدات أو المستلزمات أثناء التنكاف، يلتزم الطرف الآخر بالتعويض الكامل.",
        "5. لا تُقدَّم خدمة التنكاف إلا بعد التوصل بالمبلغ الكامل المتفق عليه مسبقًا.",
        "---",
        "1. القاعة تُكرى للمناسبة المتفق عليها فقط وفي التاريخ المحدد و اي زيادة في المعدات يحتسب تمنه.",
        "2. احترام وقت الدخول والخروج إلزامي، وأي تجاوز يُحتسب بتكلفة إضافية.",
        "3. الزبونة مسؤولة عن أي ضرر يلحق بالقاعة، التجهيزات، أو الممتلكات، ويلزمها التعويض الكامل.",
        "4. يمنع استعمال القاعة لأي نشاط مخالف لما تم الاتفاق عليه مسبقًا.",
        "---",
        "1. العربون إلزامي لتأكيد الحجز، ولا يُعتبر الحجز ساريًا بدونه.",
        "2. العربون غير قابل للاسترجاع في حالة الإلغاء من طرف الزبونة لأي سبب كان.",
        "3. يجب تسديد المبلغ المتبقي كاملًا قبل موعد المناسبة بأسبوع (7 أيام).",
        "4. لا تُقدَّم أي خدمة (تنكاف، تكشيطة، أو قاعة) قبل التوصل بالمبلغ الكامل.",
        "أي إخلال بأحد الشروط المذكورة أعلاه يعطي الحق للجهة المقدمة للخدمة في إلغاء الاتفاق دون أي تعويض.",
        "• الموافقة على الحجز تعني الاطلاع والموافقة التامة على جميع الشروط دون استثناء."
    ]

    return generate_pdf(response, "Rosa Event", client, event.id, event.event_date, items, total, "", conditions=terms)

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_salon_visit_pdf(request, pk):
    try:
        visit = SalonVisit.objects.get(pk=pk)
    except SalonVisit.DoesNotExist:
        return Response({'error': 'Visit not found'}, status=404)
    
    client = visit.client
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="visit_{visit.id}.pdf"'
    
    return generate_pdf(response, "Salon Receipt", client, visit.id, visit.date, visit.services.all(), visit.total_amount, "مع تحيات صالون روزا إيفنت")

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def download_dress_rental_pdf(request, pk):
    try:
        rental = DressRental.objects.get(pk=pk)
    except DressRental.DoesNotExist:
        return Response({'error': 'Rental not found'}, status=404)
        
    client = rental.client
    dress = rental.dress
    
    class RentalItem:
        def __init__(self, name, price):
            self.item = type('obj', (object,), {'name': name})
            self.quantity = 1
            self.price_at_booking = price 
            self.price = price
    
    item_name = f"{dress.name} ({dress.reference})"
    items = [RentalItem(item_name, rental.total_price)]
    
    terms = [
        "1. يتم تحديد توقيت التنكاف مسبقًا وبالاتفاق مع الزبونة، وأي تغيير في الوقت يجب إبلاغنا به قبل المناسبة بمدة كافية.",
        "2. جميع مصاريف التنقل، المعدات، والطاقم (الخدامين) تكون على عاتق الزبونة بشكل كامل.",
        "3. لا تتحمل الجهة المقدمة للخدمة أي تأخير ناتج عن ظروف خارجة عن إرادتها (ازدحام، ظروف مناخية، تأخر الزبونة...).",
        "4. في حال حدوث أي ضرر للمعدات أو المستلزمات أثناء التنكاف، يلتزم الطرف الآخر بالتعويض الكامل.",
        "5. لا تُقدَّم خدمة التنكاف إلا بعد التوصل بالمبلغ الكامل المتفق عليه مسبقًا.",
        "---",
        "1. القاعة تُكرى للمناسبة المتفق عليها فقط وفي التاريخ المحدد و اي زيادة في المعدات يحتسب تمنه.",
        "2. احترام وقت الدخول والخروج إلزامي، وأي تجاوز يُحتسب بتكلفة إضافية.",
        "3. الزبونة مسؤولة عن أي ضرر يلحق بالقاعة، التجهيزات، أو الممتلكات، ويلزمها التعويض الكامل.",
        "4. يمنع استعمال القاعة لأي نشاط مخالف لما تم الاتفاق عليه مسبقًا.",
        "---",
        "1. العربون إلزامي لتأكيد الحجز، ولا يُعتبر الحجز ساريًا بدونه.",
        "2. العربون غير قابل للاسترجاع في حالة الإلغاء من طرف الزبونة لأي سبب كان.",
        "3. يجب تسديد المبلغ المتبقي كاملًا قبل موعد المناسبة بأسبوع (7 أيام).",
        "4. لا تُقدَّم أي خدمة (تنكاف، تكشيطة، أو قاعة) قبل التوصل بالمبلغ الكامل.",
        "أي إخلال بأحد الشروط المذكورة أعلاه يعطي الحق للجهة المقدمة للخدمة في إلغاء الاتفاق دون أي تعويض.",
        "• الموافقة على الحجز تعني الاطلاع والموافقة التامة على جميع الشروط دون استثناء."
    ]

    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="rental_{rental.id}.pdf"'
    
    return generate_pdf(response, "Rosa Event", client, rental.id, rental.start_date, items, rental.total_price, "", conditions=terms)

def generate_pdf(response, title_text, client, ref_id, date_str, items, total_amount, footer_note="", conditions=None):
    if conditions is None:
        conditions = []

    def ar(text):
        if not text: return ""
        try:
            reshaped_text = arabic_reshaper.reshape(str(text))
            return get_display(reshaped_text)
        except:
            return str(text)

    font_path = os.path.join(settings.BASE_DIR, "Amiri-Regular.ttf")
    font_name = "Amiri"
    try:
        if not os.path.exists(font_path):
             url = "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf"
             urllib.request.urlretrieve(url, font_path)
        pdfmetrics.registerFont(TTFont(font_name, font_path))
    except:
        font_name = "Helvetica"

    doc = SimpleDocTemplate(
        response,
        pagesize=A4,
        rightMargin=30, leftMargin=30,
        topMargin=30, bottomMargin=240 
    )

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontName=font_name, fontSize=24, alignment=TA_CENTER, spaceAfter=20, textColor=colors.HexColor('#B45309'))
    style_normal = ParagraphStyle('CustomNormal', parent=styles['Normal'], fontName=font_name, fontSize=11, alignment=TA_RIGHT, leading=16)
    style_table_header = ParagraphStyle('TableHeader', parent=styles['Normal'], fontName=font_name, fontSize=10, alignment=TA_CENTER, textColor=colors.white)
    style_table_cell = ParagraphStyle('TableCell', parent=styles['Normal'], fontName=font_name, fontSize=10, alignment=TA_CENTER, textColor=colors.black)

    elements = []
    
    elements.append(Paragraph(ar(title_text), style_title))
    contact_data = [["Facebook: Roza event", "Instagram: roza.rose8."], ["Tiktok: roza event kalaa", "Whatsapp: 0662605544"]]
    contact_table = Table(contact_data, colWidths=[200, 200])
    contact_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'), ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#4B5563')), ('FONTSIZE', (0,0), (-1,-1), 9)]))
    elements.append(contact_table)
    elements.append(Spacer(1, 30))

    box_data = [
        [Paragraph(ar(f"<b>تاريخ:</b> {date_str}"), style_normal), Paragraph(ar(f"<b>الزبون:</b> {client.first_name} {client.last_name}"), style_normal)],
        [Paragraph(ar(f"<b>رقم المرجع:</b> {ref_id}"), style_normal), Paragraph(ar(f"<b>الهاتف:</b> {client.phone}"), style_normal)]
    ]
    info_table = Table(box_data, colWidths=[240, 240])
    info_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')), ('ALIGN', (0,0), (-1,-1), 'RIGHT'), ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')), ('PADDING', (0,0), (-1,-1), 12)]))
    elements.append(info_table)
    elements.append(Spacer(1, 30))

    headers = [Paragraph(ar("المجموع"), style_table_header), Paragraph(ar("السعر"), style_table_header), Paragraph(ar("الكمية"), style_table_header), Paragraph(ar("الخدمة / المنتج"), style_table_header)]
    table_data = [headers]
    
    for item in items:
        name = "Unknown"
        if hasattr(item, 'item'):
            if hasattr(item.item, 'name'):
                 name = item.item.name
        elif hasattr(item, 'name'):
             name = item.name
        
        qty = getattr(item, 'quantity', 1) 
        
        if hasattr(item, 'price_at_booking'):
            price = item.price_at_booking
        elif hasattr(item, 'price'):
            price = item.price
        else:
            price = 0
            
        line_total = float(qty) * float(price)
        
        row = [
            Paragraph(f"{line_total:.2f}", style_table_cell), 
            Paragraph(f"{price:.2f}", style_table_cell), 
            Paragraph(str(qty), style_table_cell), 
            Paragraph(ar(name), style_table_cell)
        ]
        table_data.append(row)

    services_table = Table(table_data, colWidths=[80, 80, 60, 280])
    services_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1F2937')), ('TEXTCOLOR', (0,0), (-1,0), colors.white), ('ALIGN', (0,0), (-1,-1), 'CENTER'), ('VALIGN', (0,0), (-1,-1), 'MIDDLE'), ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')), ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAFB')])]))
    elements.append(services_table)
    elements.append(Spacer(1, 20))

    total_table = Table([[Paragraph(f"{total_amount:.2f} MAD", style_title), Paragraph(ar("المجموع الكلي:"), style_title)]], colWidths=[200, 200])
    total_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'RIGHT'), ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#1F2937')), ('PADDING', (0,0), (-1,-1), 15)]))
    elements.append(total_table)

    def draw_footer(canvas, doc):
        canvas.saveState()
        style_terms = ParagraphStyle('TermsStyle', parent=styles['Normal'], fontName=font_name, fontSize=8, leading=10, alignment=TA_RIGHT, textColor=colors.HexColor('#4B5563'))
        
        terms_content = []
        if footer_note:
            terms_content.append(Paragraph(ar(footer_note), style_normal))
            terms_content.append(Spacer(1, 10))

        if conditions:
            terms_content.append(Paragraph(ar("الشروط والأحكام:"), ParagraphStyle('TermsHeader', parent=styles['Normal'], fontName=font_name, fontSize=9, alignment=TA_RIGHT)))
            terms_content.append(Spacer(1, 4))
            
            for cond in conditions:
                 if cond == "---":
                     terms_content.append(Spacer(1, 4))
                     continue
                 terms_content.append(Paragraph(ar(cond), style_terms))
                 terms_content.append(Spacer(1, 2))

        items_table = Table([[terms_content]], colWidths=[doc.width])
        items_table.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F9FAFB')), ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#9CA3AF')), ('PADDING', (0,0), (-1,-1), 8), ('VALIGN', (0,0), (-1,-1), 'TOP')]))
        
        items_table.wrapOn(canvas, doc.width, doc.bottomMargin)
        items_table.drawOn(canvas, doc.leftMargin, 20)
        canvas.restoreState()

    doc.build(elements, onFirstPage=draw_footer, onLaterPages=draw_footer)
    return response


