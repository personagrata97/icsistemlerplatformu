---
description: Projeye özel geliştirme kuralları - her konuşmada otomatik uygulanır
---

# İç Sistemler Platformu - Geliştirme Kuralları

Bu dosya, tüm kod geliştirme süreçlerinde uyulması gereken temel kuralları içerir.

## Tasarım ve Mimari Kuralları
1. **Merkezi bileşenleri kullan:** Modal, Button, StatusBadge, CustomSelect, StatCard, Tooltip, Pagination, SearchInput, LoadingState gibi mevcut UI bileşenlerini tercih et. Yeni bir bileşen yazmadan önce mevcut `components/ui/` dizinini kontrol et.
2. **Tasarım diline uygun ilerle:** Mevcut renk paleti, tipografi, kart yapısı ve genel görsel dile sadık kal.
3. **Prisma servisini merkezi kullan:** `PrismaService` her zaman `common/prisma.service.ts` üzerinden enjekte edilir.

## Standart ve Mevzuat Referansları
4. **Pentana / TeamMate Pro standartlarına göre analiz yap:** Denetim modülünde yapılan her geliştirme, Pentana ve TeamMate gibi kurumsal denetim yazılımlarının sunduğu yetkinlik seviyesiyle kıyaslanarak değerlendirilmelidir.
16. **Tasarruf Finansmanı mevzuatına uygun çalış:** BDDK Tasarruf Finansman Şirketleri Yönetmeliği, Cayma/Fesih hakları, Organizasyon Ücreti İade kuralları ve Likidite gereklilikleri her zaman göz önünde bulundurulmalıdır.
17. **IIA (Uluslararası İç Denetim Standartları) referans al:** Örneklem, bulgu, çalışma kağıdı ve raporlama süreçlerinde IIA standartlarını teknik altyapı olarak kullan.

## Bilgi Güvenliği ve KVKK Kuralları
18. **KVKK (Kişisel Verilerin Korunması Kanunu) uyumluluğu sağla:** Kişisel veri işleme, saklama, maskeleme ve silme süreçlerinde 6698 sayılı KVKK'ya uygunluk sağlanmalıdır. TCKN, IBAN, telefon gibi hassas veriler mutlaka maskelenmeli veya anonimleştirilmelidir.
19. **Bilgi güvenliğini sorgula:** Her geliştirmede yetkilendirme (guards), oturum güvenliği (idle timeout), rate limiting, güvenlik başlıkları (helmet) ve hassas veri koruması boyutlarını kontrol et.

## Dil ve Üslup Kuralları
7. **İngilizce tabir kullanma:** Kod yorumlarında, hata mesajlarında, kullanıcıya gösterilen tüm metinlerde Türkçe kullan. Değişken isimleri hariç (teknik zorunluluk).
8. **Yapay ve akademik dil kullanma:** Doğal, anlaşılır Türkçe yaz. "Spesifik entite bazlı anomali deteksiyon mekanizması" yerine "riskli kayıtları tespit eden kontrol" gibi yaz.
9. **Dış Kaynak Referanslarını (IIA, Pentana, BDDK vb.) Metinlerde Gizle:** Kullanıcı arayüzünde, hata mesajlarında veya kod içi yorum / dokümantasyonlarda "Pentana standardına göre", "IIA 2500 maddesi uyarınca", "BDDK yönetmeliği" gibi spesifik marka, kurum veya dış kaynak isimleri geçmemelidir. Amaç, sistemin dışarıdan kopyalanmış veya başka bir yere atıf yapan bir şablon gibi görünmesini engellemek, özgün ve kuruma ait bir sistem hissi vermektir. Standartların *mantığını* uygula ancak ismini zikretme.
10. **Tarih ve Yüzde Formatı (Türk Standardı):** 
    - Tarihler Türk standartlarında mutlaka **GÜN.AY.YIL** formatında (örneğin: 15.10.2025) yazılır. Ay ismiyle de yazılabilir (15 Ekim 2025). Ancak asla YYYY-MM-DD veya MM/DD/YYYY formatında doğrudan arayüzde gösterilmez.
    - Yüzde oranları İngiliz formatındaki gibi sona (90%) değil, Türk formatında **başa** (%90) yazılarak gösterilir. İşaret ile sayı arasında boşluk bırakılmaz.

## Kalite Kuralları
10. **Tasarım ve İşlevsellik Kontrolü (Sürekli):** Sistemi her kontrol edişinde; merkezi bileşenlere aykırı, tasarım diline uymayan tasarımlar, çalışmayan veya hatalı çalışan butonlar/ekranlar denetlenir ve derhal düzeltilir.
11. **Yüzeysel çalışma yapma:** "Var" demeden önce gerçekten satır satır kontrol et. Eksik varsa dürüstçe söyle.
12. **Var olan şeyi tekrar önerme:** Kodda zaten varolan bir özelliği "yeni eklenmeli" diye önerme. Önce mevcut kodu tara.
12. **Ekranları en ince detayına kadar kontrol et:** Alt ekranlara, modallara, yan panellere kadar girerek incele. Sadece ana sayfaya bakıp "tamam" deme.
13. **Tasarım dilini asla bozma:** Mevcut renk paleti, gölge, border-radius, spacing, tipografi tutarlılığını koru. Yeni eklenen her bileşen mevcut tasarımla uyumlu olmalı.
14. **Merkezi bileşen oluştur ve kullan:** Tekrar eden UI kalıplarını merkezi bileşen olarak `components/ui/` altına taşı. Aynı kodu birden fazla yerde tekrarlama.
15. **Tam işlevsel geliştir, mock yapma:** Bir özellik eklendiğinde tüm alt ekranları, butonları, modalları çalışır halde teslim et. Görsel olarak var ama tıklanınca çalışmayan, sahte veri gösteren veya "yakında gelecek" yazan bileşen bırakma.
16. **Eksik taramasında standart ve mevzuata göre çalış:** "Sistemde eksik var mı" dendiğinde, yukarıdaki tüm referanslara (Pentana, TeamMate, IIA, BDDK, KVKK, Tasarruf Finansmanı mevzuatı) göre sistematik tarama yap ve somut eksikleri raporla.
17. **Mükemmel Entegrasyon:** Yapılacak geliştirmeler/eklemeler izole kalmamalı; entegre olması gereken diğer ekranlarla tam entegre çalışmalı ve birbirinden beslenmelidir (Örn: Bir risk hesaplaması, ilgili denetim planına yansımalıdır).
18. **Hayalet/Kopuk Sayfa Bırakma (Sürekli Kontrol):** Sistemde arayüzleri, kodları (page.tsx) ve iş mantığı hazır olduğu halde menülerden (Sidebar, Header, Ayarlar vb.) bağlantı verilmediği için **ulaşılamayan hiçbir sayfa** bırakılmamalıdır. Sistem taramalarında mutlaka rotalara (Sidebar/Navbar) dahil edilmemiş "Yetim" (Orphan) sayfalar da düzenli olarak taramadan geçirilmelidir. **Kapsamlı URL/Navigasyon Taraması Yap:** Sayfaların menüde olup olmadığını kontrol ederken **SADECE SİDEBAR'A BAKMA**. Kontrollerini mutlaka sayfa içindeki **Tab sekmeleri (SegmentedTabs), Navbar yönlendirmeleri, Header Action butonları, Tablo satır aksiyonları (Action Icon) ve Bildirim/Badge ikonları** dahil olmak üzere tüm UI bileşenlerini kapsayacak şekilde derinlemesine yap.
