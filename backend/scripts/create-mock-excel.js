const XLSX = require('xlsx');
const path = require('path');

const data = [
    {
        'Müşteri': 'Selim Kaya',
        'Sözleşme No': 'SZ-9001',
        'Sözleşme Tutarı': 300000,
        'Sözleşme Tarihi': '2026-02-01',
        'Vade': 36,
        'Gecikme Günü': 0,
        'Segment': 'BİREYSEL',
        'Bölge': 'MARMARA',
        'Şube': 'Kadıköy',
        'İptal': 'Hayır'
    },
    {
        'Müşteri': 'Ayşe Demir',
        'Sözleşme No': 'SZ-9002',
        'Sözleşme Tutarı': 450000,
        'Sözleşme Tarihi': '2026-03-15',
        'Vade': 48,
        'Gecikme Günü': 95, // Takip/NPL adayı
        'Segment': 'BİREYSEL',
        'Bölge': 'EGE',
        'Şube': 'İzmir',
        'İptal': 'Hayır'
    },
    {
        'Müşteri': 'Korsan A.Ş.',
        'Sözleşme No': 'SZ-9003',
        'Sözleşme Tutarı': 1000000, // Büyük tutar
        'Sözleşme Tarihi': '2026-01-10',
        'Vade': 60,
        'Gecikme Günü': 0,
        'Segment': 'KURUMSAL', // Tüzel kişi yoğunlaşma riski testi
        'Bölge': 'AKDENİZ',
        'Şube': 'Antalya',
        'İptal': 'Hayır'
    },
    {
        'Müşteri': 'Mehmet Öztürk',
        'Sözleşme No': 'SZ-9004',
        'Sözleşme Tutarı': 150000,
        'Sözleşme Tarihi': '2026-06-01',
        'Vade': 12,
        'Gecikme Günü': 0,
        'Segment': 'BİREYSEL',
        'Bölge': 'MARMARA',
        'Şube': 'Üsküdar',
        'İptal': 'Evet' // İptal oranı testi
    }
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Sozlesmeler');

const filePath = path.join(__dirname, 'mock_sozlesmeler.xlsx');
XLSX.writeFile(wb, filePath);
console.log(`Mock Excel dosyası oluşturuldu: ${filePath}`);
