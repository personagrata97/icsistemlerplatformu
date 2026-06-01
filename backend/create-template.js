const docx = require("docx");
const fs = require("fs");
const path = require("path");

const { Document, Packer, Paragraph, HeadingLevel } = docx;

const doc = new Document({
    sections: [
        {
            properties: {},
            children: [
                new Paragraph({
                    text: "{denetim_baslik} Raporu",
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph("Denetim Kodu: {denetim_kodu}"),
                new Paragraph("Denetilen Birim: {denetilen_birim}"),
                new Paragraph("Rapor Tarihi: {rapor_tarihi}"),
                new Paragraph(" "),
                new Paragraph({
                    text: "1. Kapsam ve Gorus",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph("Kapsam: {denetim_kapsami}"),
                new Paragraph("Gorus: {denetim_gorusu}"),
                new Paragraph(" "),
                new Paragraph({
                    text: "2. Bulgular",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph("Aşağıda tespit edilen bulgular listelenmiştir:"),

                // Docxtemplater loop block tags
                new Paragraph("{#bulgular}"),
                new Paragraph({
                    text: "{.sira_no}. {.bulgu_baslik} ({.risk_seviyesi})", // using dot syntax inside loops as standard for docxtemplater if array of objects
                    heading: HeadingLevel.HEADING_2,
                }),
                // Actually docxtemplater is fine with {sira_no} when iterating objects. Let's use {sira_no}.
                new Paragraph("Kategori: {kategori}"),
                new Paragraph("Kok Neden: {kok_neden}"),
                new Paragraph("Bulgu Icerigi:"),
                new Paragraph("{icerik}"),
                new Paragraph("Bulgu Etkisi:"),
                new Paragraph("{etki}"),
                new Paragraph("Mufettis Onerisi:"),
                new Paragraph("{oneri}"),
                new Paragraph(" "),
                new Paragraph("Birim Cevabi / Aksiyon:"),
                new Paragraph("{birim_cevabi} / {birim_aksiyon_plani}"),
                new Paragraph("Mutabakat Durumu: {is_mutabik}"),
                new Paragraph("Mutabakatsizlik Nedeni: {mutabik_kalinamama_nedeni}"),
                new Paragraph("--------------------------------------------------"),
                new Paragraph("{/bulgular}"),

                new Paragraph(" "),
                new Paragraph("Raporu Hazirlayan: {hazirlayan}")
            ],
        },
    ],
});

const uploadDir = path.join(__dirname, "uploads", "templates");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(path.join(uploadDir, "tasarruf_finans_rapor_sablonu.docx"), buffer);
    console.log("Template generated successfully!");
}).catch(err => {
    console.error("Error generating template:", err);
});
