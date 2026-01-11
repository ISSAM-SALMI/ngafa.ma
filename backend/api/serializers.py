from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Client, SalonService, SalonVisit, Dress, DressRental,
    NgafaItem, NgafaEvent, NgafaBookingItem
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class SalonServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalonService
        fields = '__all__'

class SalonVisitSerializer(serializers.ModelSerializer):
    services_details = SalonServiceSerializer(source='services', many=True, read_only=True)
    services = serializers.PrimaryKeyRelatedField(many=True, queryset=SalonService.objects.all())

    class Meta:
        model = SalonVisit
        fields = ['id', 'client', 'date', 'services', 'services_details', 'total_amount', 'status']

class DressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dress
        fields = '__all__'

class DressRentalSerializer(serializers.ModelSerializer):
    dress_details = DressSerializer(source='dress', read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)

    class Meta:
        model = DressRental
        fields = ['id', 'client', 'client_details', 'dress', 'dress_details', 'start_date', 'end_date', 'total_price', 'status']

class NgafaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NgafaItem
        fields = '__all__'

class NgafaBookingItemSerializer(serializers.ModelSerializer):
    item_details = NgafaItemSerializer(source='item', read_only=True)
    item = serializers.PrimaryKeyRelatedField(queryset=NgafaItem.objects.all())
    event = serializers.PrimaryKeyRelatedField(queryset=NgafaEvent.objects.all())

    class Meta:
        model = NgafaBookingItem
        fields = ['id', 'event', 'item', 'item_details', 'quantity', 'price_at_booking']

class NgafaEventSerializer(serializers.ModelSerializer):
    items = NgafaBookingItemSerializer(source='ngafabookingitem_set', many=True, read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)

    class Meta:
        model = NgafaEvent
        fields = ['id', 'client', 'client_details', 'event_date', 'status', 'total_price', 'items']
