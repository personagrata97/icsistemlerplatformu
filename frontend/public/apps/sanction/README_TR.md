# Sanction Scanner - Kullanım Kılavuzu

## 🚨 Önemli: Sayfalar Neden Açılmıyor?

Eğer `index.html` dosyasına çift tıklayarak uygulamayı açmaya çalışırsanız, **sayfalar düzgün çalışmayacaktır**. 

### Sorunun Nedeni

Modern tarayıcılar, güvenlik nedeniyle doğrudan dosya sisteminizden (`file:///...`) açılan web sayfalarının internet üzerindeki HTTPS kaynaklarına erişimini kısıtlar. Bu uygulamada:
- Resmi Gazete taraması için proxy servisleri
- PDF işleme için CDN kaynakları
- Veri güncelleme için harici API'ler

kullanıldığından, tarayıcı bu kaynaklara erişimi engelleyecek ve uygulama düzgün çalışmayacaktır.

### ✅ Çözüm: Yerel Sunucu Kullanımı

Uygulamayı **yerel bir HTTP sunucusu** üzerinden çalıştırmanız gerekmektedir. Bu sayede tarayıcı, uygulamanın bir web sitesi gibi çalıştığını düşünecek ve tüm kaynaklara erişim sağlayacaktır.

## 🚀 Nasıl Başlatılır?

### Yöntem 1: Batch Script ile (Önerilen - Daha Kolay)

1. **`start_server.bat`** dosyasına **çift tıklayın**
2. Bir komut penceresi açılacak ve sunucu başlayacak
3. Tarayıcınızda şu adresi açın: **`http://localhost:8080`**
4. Uygulama artık düzgün çalışacak! 🎉

**Not:** Sunucuyu durdurmak için komut penceresinde `Ctrl+C` tuşlarına basın.

### Yöntem 2: PowerShell ile

1. **`start_server.ps1`** dosyasına **sağ tıklayın**
2. **"PowerShell ile Çalıştır"** seçeneğini seçin
3. Tarayıcınızda şu adresi açın: **`http://localhost:8080`**

### Yöntem 3: Manuel Komut Satırı

1. Bu klasörde **PowerShell** veya **Komut İstemi** açın
2. Şu komutu çalıştırın:
   ```bash
   python -m http.server 8080
   ```
3. Tarayıcınızda şu adresi açın: **`http://localhost:8080`**

## 📋 Gereksinimler

- **Python 3.x** kurulu olmalı
  - Python kurulu mu kontrol etmek için: `python --version`
  - Python yoksa [buradan](https://www.python.org/downloads/) indirebilirsiniz

## 🔧 Sorun Giderme

### "python komutu tanınmıyor" hatası alıyorum

**Çözüm 1:** Python'un PATH'e eklendiğinden emin olun
- Python kurulumunu tekrar yapın ve "Add Python to PATH" seçeneğini işaretleyin

**Çözüm 2:** Python 3 için `python3` komutunu deneyin
- Batch dosyasındaki `python` kelimesini `python3` olarak değiştirin

### Port 8080 zaten kullanımda hatası

**Çözüm:** Farklı bir port numarası kullanın
- Script dosyalarındaki `8080` değerini `8081`, `8082` veya başka bir port numarasıyla değiştirin
- Tarayıcıda da aynı port numarasını kullanın: `http://localhost:8081`

### Sayfa yüklenmiyor / boş ekran görünüyor

**Çözüm 1:** Sunucunun çalıştığından emin olun
- Komut penceresinde "Serving HTTP on :: port 8080..." mesajı görünmeli

**Çözüm 2:** Doğru adresi kullandığınızdan emin olun
- `http://localhost:8080` adresini kullanın (HTTPS değil!)
- `file:///...` ile başlayan adresler çalışmaz

**Çözüm 3:** Tarayıcı önbelleğini temizleyin
- `Ctrl+Shift+R` veya `Ctrl+F5` ile sayfayı yenileyin

### Tarayıcı konsolunda hata görüyorum

**Tarayıcı Konsolunu Açma:**
- Chrome/Edge: `F12` veya `Ctrl+Shift+I`
- Firefox: `F12` veya `Ctrl+Shift+K`

**Yaygın Hatalar:**
- `CORS` hataları → Sunucuyu kullandığınızdan emin olun
- `Failed to fetch` → İnternet bağlantınızı kontrol edin
- `404 Not Found` → Doğru dizinde olduğunuzdan emin olun

## 📱 Uygulama Özellikleri

- ✅ **Dashboard**: Genel istatistikler ve veri kaynaklarının durumu
- ✅ **Tarama Yap**: Manuel veya toplu müşteri taraması
- ✅ **Tarama Sonuçları**: Geçmiş tarama kayıtları
- ✅ **Şüpheli İşlem Bildir**: MASAK bildirimi oluşturma
- ✅ **Bildirim Yönetimi**: Admin paneli
- ✅ **İşlem Geçmişi**: Tüm sistem aktivitelerinin logu
- ✅ **Ayarlar**: Veri kaynakları ve whitelist yönetimi

## 📊 Veri Kaynakları

Uygulama aşağıdaki yaptırım listelerini tarar:
- 🇹🇷 **MASAK** (Mali Suçları Araştırma Kurulu)
- 🇹🇷 **Resmi Gazete** (BKK/CBK Kararları)
- 🇺🇳 **UN** (Birleşmiş Milletler)
- 🇪🇺 **EU** (Avrupa Birliği)
- 🇺🇸 **OFAC** (ABD Hazine Bakanlığı)

## 🔄 Veri Güncelleme

Yaptırım listelerini güncellemek için:

```bash
cd scripts
python update_data.py
```

Otomatik günlük güncelleme için `scripts/daily_update.bat` dosyasını Windows Zamanlanmış Görevler'e ekleyebilirsiniz.

## 💡 İpuçları

1. **Bookmark Oluşturun**: `http://localhost:8080` adresini tarayıcınıza bookmark olarak kaydedin
2. **Otomatik Başlatma**: Bilgisayar açılışında sunucuyu otomatik başlatmak için `start_server.bat` dosyasını Başlangıç klasörüne ekleyin
3. **Güvenlik**: Yerel sunucu sadece bilgisayarınızdan erişilebilir, dışarıdan erişim yoktur

## 📞 Destek

Sorun yaşıyorsanız:
1. Bu README dosyasındaki sorun giderme bölümünü inceleyin
2. Tarayıcı konsolundaki hata mesajlarını kontrol edin
3. Python'un doğru kurulu olduğundan emin olun

---

**Son Güncelleme:** 2025-12-06  
**Versiyon:** 1.0
