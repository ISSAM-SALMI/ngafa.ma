from django.db import models
from django.contrib.auth.models import User

# --- Enums ---
class ModuleType(models.TextChoices):
    SALON = 'SALON', 'Salon'
    DRESSES = 'DRESSES', 'Dresses'
    NGAFA = 'NGAFA', 'Ngafa'

class DressStatus(models.TextChoices):
    AVAILABLE = 'AVAILABLE', 'Available'
    RENTED = 'RENTED', 'Rented'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'

class RentalStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    RETURNED = 'RETURNED', 'Returned'
    CANCELLED = 'CANCELLED', 'Cancelled'

class EventStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

class VisitStatus(models.TextChoices):
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'

# --- Client ---
class Client(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    cin = models.CharField(max_length=20, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    module = models.CharField(max_length=20, choices=ModuleType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

# --- Module 1: Salon ---
class SalonService(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class SalonVisit(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='visits')
    date = models.DateTimeField()
    services = models.ManyToManyField(SalonService, related_name='visits')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=VisitStatus.choices, default=VisitStatus.COMPLETED)

# --- Module 2: Dresses ---
class Dress(models.Model):
    name = models.CharField(max_length=200)
    reference = models.CharField(max_length=100, unique=True)
    size = models.CharField(max_length=20)
    color = models.CharField(max_length=50)
    price_per_day = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=DressStatus.choices, default=DressStatus.AVAILABLE)
    image = models.ImageField(upload_to='dresses/', blank=True, null=True)

    def __str__(self):
        return self.name

class DressRental(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='rentals')
    dress = models.ForeignKey(Dress, on_delete=models.CASCADE, related_name='rentals')
    start_date = models.DateField()
    end_date = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=RentalStatus.choices, default=RentalStatus.ACTIVE)

# --- Module 3: Ngafa ---
class NgafaItem(models.Model):
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    total_quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class NgafaEvent(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='events')
    event_date = models.DateField()
    status = models.CharField(max_length=20, choices=EventStatus.choices, default=EventStatus.PENDING)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    items = models.ManyToManyField(NgafaItem, through='NgafaBookingItem')

class NgafaBookingItem(models.Model):
    event = models.ForeignKey(NgafaEvent, on_delete=models.CASCADE)
    item = models.ForeignKey(NgafaItem, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price_at_booking = models.DecimalField(max_digits=10, decimal_places=2)
