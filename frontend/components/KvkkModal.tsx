import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface KvkkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KvkkModal({ isOpen, onClose }: KvkkModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="KVKK Aydınlatma Metni"
            size="lg"
            footer={
                <div className="w-full flex justify-end">
                    <Button variant="primary" onClick={onClose}>Okudum, Anladım</Button>
                </div>
            }
        >
            <div className="space-y-4 text-sm text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
                <h4 className="font-bold text-gray-900">1. Veri Sorumlusu</h4>
                <p>
                    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla Emlak Katılım (bundan sonra "Banka" olarak anılacaktır) tarafından aşağıda açıklanan amaçlar kapsamında işlenebilecektir.
                </p>

                <h4 className="font-bold text-gray-900 mt-4">2. Kişisel Verilerin İşlenme Amacı</h4>
                <p>
                    Denetim ve İç Kontrol Platformu ("Auditron") üzerinden elde edilen kimlik, iletişim, işlem güvenliği ve denetim log kayıtlarına ait kişisel verileriniz;
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Sistem kullanımında erişim yetkilerinin yönetilmesi ve kimlik doğrulamanın sağlanması,</li>
                    <li>Kurum içi denetim, teftiş ve iç kontrol faaliyetlerinin yürütülmesi,</li>
                    <li>WORM Log altyapısı sayesinde işlem güvenliğinin ve bilgi güvenliği standartlarının temini,</li>
                    <li>Yasalarca yetkili düzenleyici kurumlar (BDDK, MASAK vb.) tarafından talep edilecek bilgi/belgelerin temin edilmesi,</li>
                </ul>
                <p className="mt-2">amaçlarıyla sınırlı olarak işlenmektedir.</p>

                <h4 className="font-bold text-gray-900 mt-4">3. Aktarım Yapılan Taraflar ve Aktarım Amacı</h4>
                <p>
                    Kişisel verileriniz, yasal düzenlemelerin öngördüğü sınırlar çerçevesinde yetkili kamu kurumlarına (BDDK, SPK, MASAK, Mahkemeler vb.) ve denetim süreçleri kapsamında Bağımsız Denetim kuruluşlarına aktarılabilecektir.
                </p>

                <h4 className="font-bold text-gray-900 mt-4">4. Toplama Yöntemi ve Hukuki Sebebi</h4>
                <p>
                    Kişisel verileriniz, platform üzerinden yaptığınız işlemler sırasında otomatik yollarla (log kayıtları, IP adresi, işlem saatleri) ve manuel veri girişleriniz aracılığıyla toplanmaktadır. İşleme faaliyeti; KVKK madde 5/2'de yer alan "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması" ve "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması" hukuki sebeplerine dayanmaktadır.
                </p>

                <h4 className="font-bold text-gray-900 mt-4">5. İlgili Kişinin Hakları</h4>
                <p>
                    KVKK'nın 11. maddesi kapsamındaki haklarınıza dair taleplerinizi Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak Bankamıza iletebilirsiniz.
                </p>
            </div>
        </Modal>
    );
}
