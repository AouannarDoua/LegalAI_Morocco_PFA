import json
import os
import re


class DataService:
    def __init__(self):
        # ✅ Fix: مسار صحيح ومطلق — backend/data/maliyum_data.json
        base_dir        = os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)
        )))
        self.file_path  = os.path.join(base_dir, 'data', 'maliyum_data.json')

    def load_data(self) -> list:
        if not os.path.exists(self.file_path):
            print(f"[DataService] ❌ Fichier introuvable: {self.file_path}")
            return []
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def get_all_templates(self) -> list:
        """
        ✅ Fix: يرجع عناوين + fields + metadata — مش عناوين فقط.
        """
        data      = self.load_data()
        templates = []
        for item in data:
            if "نموذج" in item.get('العنوان', '') or "عقد" in item.get('العنوان', ''):
                content = item.get('المحتوى_الكامل', '')
                fields  = list(set(re.findall(r'\{(.*?)\}', content)))
                templates.append({
                    "title":    item.get('العنوان', ''),
                    "fields":   fields,
                    "category": item.get('التصنيفات', ''),
                    "url":      item.get('الرابط', ''),
                    "download": item.get('روابط_التحميل', ''),
                })
        return templates

    def get_by_category(self, category: str) -> list:
        """
        جلب الوثائق حسب التصنيف.
        """
        data = self.load_data()
        return [
            item for item in data
            if category in item.get('التصنيفات', '')
        ]

    def search(self, query: str) -> list:
        """
        بحث بسيط بالكلمات المفتاحية.
        """
        data    = self.load_data()
        query_l = query.lower()
        return [
            item for item in data
            if query_l in item.get('العنوان', '').lower()
            or query_l in item.get('المحتوى', '').lower()
        ]


data_service = DataService()