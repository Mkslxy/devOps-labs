import os
import django
from django.conf import settings

# Setup django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'UniSchool.settings')
django.setup()

from django.apps import apps
from django.db import models

TYPE_MAPPING = {
    'AutoField': 'integer',
    'BigAutoField': 'bigint',
    'SmallAutoField': 'smallint',
    'CharField': 'varchar',
    'TextField': 'text',
    'IntegerField': 'integer',
    'SmallIntegerField': 'smallint',
    'BigIntegerField': 'bigint',
    'FloatField': 'float',
    'DecimalField': 'decimal',
    'BooleanField': 'boolean',
    'NullBooleanField': 'boolean',
    'DateTimeField': 'timestamp',
    'DateField': 'date',
    'TimeField': 'time',
    'DurationField': 'interval',
    'EmailField': 'varchar',
    'URLField': 'varchar',
    'UUIDField': 'uuid',
    'FileField': 'varchar',
    'ImageField': 'varchar',
    'JSONField': 'json',
    'ForeignKey': 'integer',
    'OneToOneField': 'integer',
}

out = []
refs = []

EXCLUDED_APPS = {'admin', 'contenttypes', 'sessions', 'messages', 'staticfiles', 'authtoken', 'drf_spectacular', 'token_blacklist'}

for model in apps.get_models():
    app_label = model._meta.app_label
    if app_label in EXCLUDED_APPS:
        continue
        
    model_name = model._meta.model_name
    table_name = f'"{app_label}.{model_name}"'
    
    out.append(f'Table {table_name} {{')
    
    for field in model._meta.get_fields():
        # Skip auto created reversed relations, but KEEP auto-created primary keys like 'id'
        if field.auto_created and not field.is_relation and not getattr(field, 'primary_key', False):
            continue
            
        if isinstance(field, (models.Field, models.ForeignKey, models.OneToOneField)):
            field_name = field.column if hasattr(field, 'column') and field.column else field.name
            field_type_class = field.__class__.__name__
            dbml_type = TYPE_MAPPING.get(field_type_class, 'varchar')
            
            modifiers = []
            if getattr(field, 'primary_key', False): modifiers.append('primary key')
            if getattr(field, 'unique', False) and not getattr(field, 'primary_key', False): modifiers.append('unique')
            if getattr(field, 'null', False): modifiers.append('null')
            else: modifiers.append('not null')
            
            modifier_str = f' [{", ".join(modifiers)}]' if modifiers else ''
            out.append(f'  "{field_name}" {dbml_type}{modifier_str}')
            
            if field.is_relation and (field.many_to_one or field.one_to_one):
                related_model = field.related_model
                if related_model:
                    rel_app = related_model._meta.app_label
                    # Skip relationships to excluded apps like contenttypes
                    if rel_app in EXCLUDED_APPS:
                        continue
                        
                    rel_name = related_model._meta.model_name
                    rel_table = f'"{rel_app}.{rel_name}"'
                    rel_field = related_model._meta.pk.column
                    symbol = '-' if field.one_to_one else '>'
                    refs.append(f'Ref: {table_name}."{field_name}" {symbol} {rel_table}."{rel_field}"')
                    
    out.append('}\n')

out.append('// Relationships')
out.extend(refs)

with open('dbml_schema.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print("Successfully generated dbml_schema.txt")
