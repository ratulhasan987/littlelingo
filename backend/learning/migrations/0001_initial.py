import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name='Learner', fields=[
            ('id',models.UUIDField(primary_key=True,default=uuid.uuid4,editable=False,serialize=False)),
            ('level',models.PositiveSmallIntegerField(default=1)),
            ('streak',models.PositiveIntegerField(default=0)),
            ('turns',models.PositiveIntegerField(default=0)),
            ('last_mode',models.CharField(max_length=24,default='learning')),
            ('current_word',models.CharField(max_length=40,blank=True,default='')),
            ('awaiting_answer',models.BooleanField(default=False)),
            ('created_at',models.DateTimeField(auto_now_add=True)),
            ('updated_at',models.DateTimeField(auto_now=True))]),
        migrations.CreateModel(name='ChatTurn',fields=[
            ('id',models.BigAutoField(primary_key=True,serialize=False)),
            ('child_text',models.CharField(max_length=240)),
            ('bot_text',models.CharField(max_length=500)),
            ('mode',models.CharField(max_length=24)),
            ('created_at',models.DateTimeField(auto_now_add=True)),
            ('learner',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name='history',to='learning.learner'))]),
        migrations.CreateModel(name='WordProgress',fields=[
            ('id',models.BigAutoField(primary_key=True,serialize=False)),
            ('word',models.CharField(max_length=40)),
            ('successes',models.PositiveSmallIntegerField(default=0)),
            ('attempts',models.PositiveSmallIntegerField(default=0)),
            ('mastered',models.BooleanField(default=False)),
            ('learner',models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name='words',to='learning.learner'))]),
        migrations.AddConstraint(model_name='wordprogress',constraint=models.UniqueConstraint(fields=('learner','word'),name='unique_learner_word')),
    ]
