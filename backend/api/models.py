from django.db import models

class Disbursement(models.Model):
    title = models.CharField(max_length=255)
    amount = models.FloatField()
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title