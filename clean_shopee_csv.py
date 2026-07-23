import csv
import io

HEADER_MAPPING_TH = {
    'Item Id': 'รหัสสินค้า',
    'Item Name': 'ชื่อสินค้า',
    'Price': 'ราคา',
    'Sales': 'ยอดขาย',
    'Shop Name': 'ชื่อร้านค้า',
    'Commission Rate': 'อัตราค่าคอมมิชชั่น',
    'Commission': 'ค่าคอมมิชชั่น',
    'Product Link': 'ลิงก์สินค้า',
    'Offer Link': 'ลิงก์ข้อเสนอ'
}

def parse_thai_number(val):
    """แปลงข้อความตัวเลขภาษาไทย/ย่อ ให้เป็นตัวเลขบริสุทธิ์"""
    if not val:
        return val
    
    val = str(val).strip()
    val_clean = val.replace('฿', '').replace('%', '').replace('+', '').strip()
    
    if 'พัน' in val_clean:
        num_str = val_clean.replace('พัน', '').strip()
        try:
            return str(int(float(num_str) * 1000))
        except ValueError:
            return val

    if 'แสน' in val_clean:
        num_str = val_clean.replace('แสน', '').strip()
        try:
            return str(int(float(num_str) * 100000))
        except ValueError:
            return val

    if 'ล้าน' in val_clean:
        num_str = val_clean.replace('ล้าน', '').strip()
        try:
            return str(int(float(num_str) * 1000000))
        except ValueError:
            return val

    try:
        num = float(val_clean)
        if num.is_integer():
            return str(int(num))
        return str(num)
    except ValueError:
        return val

def clean_csv_content(raw_csv_string, convert_headers_to_thai=True):
    f_in = io.StringIO(raw_csv_string.strip())
    reader = csv.DictReader(f_in)
    
    original_fieldnames = reader.fieldnames
    
    if convert_headers_to_thai:
        new_fieldnames = [HEADER_MAPPING_TH.get(h.strip(), h.strip()) for h in original_fieldnames]
    else:
        new_fieldnames = [h.strip() for h in original_fieldnames]

    rows = []
    target_columns = ['Price', 'Sales', 'Commission Rate', 'Commission']
    
    for row in reader:
        new_row = {}
        for orig_h in original_fieldnames:
            val = row[orig_h]
            orig_h_trimmed = orig_h.strip()
            
            if orig_h_trimmed in target_columns:
                val = parse_thai_number(val)
                
            target_h = HEADER_MAPPING_TH.get(orig_h_trimmed, orig_h_trimmed) if convert_headers_to_thai else orig_h_trimmed
            new_row[target_h] = val
            
        rows.append(new_row)
        
    return new_fieldnames, rows

raw_csv_data = """Item Id,Item Name,Price,Sales,Shop Name,Commission Rate,Commission,Product Link,Offer Link
28906364060,ปุ๋ยน้ำสูตร 21-3-3 ( 5 แถมฟรี 1 ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว #สูตรปุ๋ยเร่งต้นทุเรียน,2.3พัน,59,จำหน่ายปุ๋ยและชีวภัณฑ์การเกษตร,13%,฿304.20,https://shopee.co.th/product/1307125575/28906364060,https://s.shopee.co.th/6pzKd9B4PG
27511746557,ปุ๋ยน้ำสูตร 21-3-3 ( 2 ขวด ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,900,89,เทพมงคล จำหน่ายปุ๋ยและชีวภัณฑ์,15%,฿135.00,https://shopee.co.th/product/16622710/27511746557,https://s.shopee.co.th/6ffuQqBhkF
27375896318,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล ( 2 ขวด ) #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ย,1.1พัน,82,เทพมงคล จำหน่ายปุ๋ยและชีวภัณฑ์,15%,฿158.40,https://shopee.co.th/product/16622710/27375896318,https://s.shopee.co.th/6VMUEXCL5E
46658097032,เทพมงคล เซ็ตปุ๋ยน้ำสูตร 4-24-24 คู่ ซุปเปอร์ไตรโค ขนาด 100 กรัม ปุ๋ยเพิ่มผลผลิต กำจัดรากเน่า โคนเน่า,683,5,ปุ๋ยตราเทพมงคล,13%,฿88.79,https://shopee.co.th/product/1004867988/46658097032,https://s.shopee.co.th/6L342ECyQD
27275827120,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล ( 2 ขวด ) #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ย,1.1พัน,68,จำหน่ายปุ๋ยและชีวภัณฑ์การเกษตร,13%,฿137.28,https://shopee.co.th/product/1307125575/27275827120,https://s.shopee.co.th/6AjdpvDblC
27218995893,ปุ๋ยน้ำสูตร 21-3-3 ( 1 ลิตร ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,880,6,ร้านปุ๋ยและชีวภัณฑ์ ตราเทพมงคล,15%,฿132.00,https://shopee.co.th/product/1343591947/27218995893,https://s.shopee.co.th/60QDdcEF6B
24488839627,อะมิโนมิค + ปุ๋ยน้ำ 21- 3 -3 ตราเทพมงคล เร่งราก เร่งการเติมโต ฟื้นฟูลำต้น #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,2.4พัน,2,ร้านปุ๋ยและชีวภัณฑ์ ตราเทพมงคล,15%,฿354.00,https://shopee.co.th/product/1343591947/24488839627,https://s.shopee.co.th/5q6nRJEsRA
27519178948,ปุ๋ยน้ำสูตร 21-3-3 ( 1 ลิตร ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว ขยายใบอ่อน,880,2,เทพมงคล ปุ๋ยเพื่อการเกษตร,15%,฿132.00,https://shopee.co.th/product/1343640853/27519178948,https://s.shopee.co.th/5fnNF0FVm9
54564146050,ปุ๋ยน้ำสูตร 13-13-13 ตราเทพมงคล ขนาด 1 ลิตร ปุ๋ยเคมีชนิดน้ำ สูตรสมดุล สูตรเสมอ สำหรับบำรุงต้น ใบ ดอก และผล,708,0,ปุ๋ยตราเทพมงคล,13%,฿92.04,https://shopee.co.th/product/1004867988/54564146050,https://s.shopee.co.th/5VTx2hG978
29075836245,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล 1 ลิตร #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ยน้ำ,588,143,จำหน่ายปุ๋ยและชีวภัณฑ์การเกษตร,13%,฿76.44,https://shopee.co.th/product/1307125575/29075836245,https://s.shopee.co.th/5LAWqOGmS7
25636236197,ปุ๋ยน้ำสูตร 21-3-3 ( 1 ลิตร ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,528,48,เทพมงคล จำหน่ายปุ๋ยและชีวภัณฑ์,15%,฿79.20,https://shopee.co.th/product/16622710/25636236197,https://s.shopee.co.th/AUsczsx6y8
27725891771,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล 1 ลิตร #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ยน้ำ,588,46,เทพมงคล จำหน่ายปุ๋ยและชีวภัณฑ์,15%,฿88.20,https://shopee.co.th/product/16622710/27725891771,https://s.shopee.co.th/AKZCnZxkJ7
28572963205,แคลโบมิคพลัส ตราเทพมงคล 1 ขวด ปุ๋ยน้ำแคลเซียมโบรอน ขนาด 1 ลิตร สูตรเข้มข้นสูง แคลเซียม 7% ต่อโบรอน1%,399,1พัน+,ปุ๋ยตราเทพมงคล,13%,฿51.87,https://shopee.co.th/product/1004867988/28572963205,https://s.shopee.co.th/AAFmbGyNe6
29105743252,ปุ๋ยน้ำสูตร 21-3-3 ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต (ปริมาณ 1 ลิตร) #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,528,104,จำหน่ายปุ๋ยและชีวภัณฑ์การเกษตร,13%,฿68.64,https://shopee.co.th/product/1307125575/29105743252,https://s.shopee.co.th/9zwMOxz0z5
29268984119,ปุ๋ยน้ำสูตร 21-3-3 ( 2 ขวด ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,1.8พัน,5,ร้านปุ๋ยและชีวภัณฑ์ ตราเทพมงคล,15%,฿264.00,https://shopee.co.th/product/1343591947/29268984119,https://s.shopee.co.th/9pcwCezeK4
26225905452,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล ( 6 ขวด ) #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ย,4.1พัน,0,ร้านปุ๋ยและชีวภัณฑ์ ตราเทพมงคล,14%,฿579.60,https://shopee.co.th/product/1343591947/26225905452,https://s.shopee.co.th/9fJW0M0Hf3
27679321583,อะมิโนมิค + ปุ๋ยน้ำ 21-3-3 ตราเทพมงคล คู่หูเร่งโต ใบเขียว หนา เร่งผล รสชาติดี,1.1พัน,70,สินค้าเกษตร byโบว์ ,10%,฿111.60,https://shopee.co.th/product/49092545/27679321583,https://s.shopee.co.th/9V05o30v02
27822962277,แคลโบมิคพลัส ตราเทพมงคล ปุ๋ยน้ำแคลเซียมโบรอน สูตรเข้มข้นสูง แคลเซียม 7% โบรอน 1% ชนิดน้ำ ขนาด 1 ลิตร,399,119,ปุ๋ยตราเทพมงคล,13%,฿51.87,https://shopee.co.th/product/1004867988/27822962277,https://s.shopee.co.th/9Kgfbk1YL1
25391302543,ปุ๋ยแคลเซียมโบรอน ตรา เทพมงคล ( 6 ขวด ) #แคลโบมิคพลัส ธาตุอาหารพืช #ขั้วเหนียว #ดอกติดดี #ดอกไม่ร่วง #ป้องกันผลแตก #ปุ๋ย,3.1พัน,1,จำหน่ายปุ๋ยและชีวภัณฑ์การเกษตร,13%,฿397.80,https://shopee.co.th/product/1307125575/25391302543,https://s.shopee.co.th/9ANFPR2Bg0
27311742410,ปุ๋ยน้ำสูตร 21-3-3 ( ซื้อ 10 แถมฟรี 2 ขวด ) ตราเทพมงคล เร่งดอก เร่งใบ เร่งโต ฟื้นฟูต้นโทรม #สูตรปุ๋ยเร่งต้นไม้ให้โตเร็ว,4.3พัน,3,เทพมงคล จำหน่ายปุ๋ยและชีวภัณฑ์,15%,฿648.00,https://shopee.co.th/product/16622710/27311742410,https://s.shopee.co.th/903pD82p0z
"""

if __name__ == "__main__":
    fieldnames, rows = clean_csv_content(raw_csv_data, convert_headers_to_thai=True)
    
    output_filename = "shopee_data_thailand.csv"
    with open(output_filename, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ บันทึกไฟล์ CSV หัวข้อภาษาไทยสำเร็จ: {output_filename} ( Encoding: UTF-8 with BOM )")
    print("\n--- หัวข้อคอลัมน์ใหม่ (ภาษาไทย) ---")
    print(fieldnames)
    print("\n--- ตัวอย่างข้อมูล 2 แถวแรก ---")
    for r in rows[:2]:
        print(r)
