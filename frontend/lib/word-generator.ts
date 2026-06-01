import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, AlignmentType, ImageRun, Header, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";
import { ORG } from './org-config';

// Helper to fetch image and convert to ArrayBuffer
const fetchImage = async (url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return await blob.arrayBuffer();
};

export const generateAuditWordReport = async (auditData: any, findings: any[]) => {
    try {
        // Fetch logo
        const logoBuffer = await fetchImage('/logo.png');

        // Main Document Content
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: "Arial",
                            size: 20, // 10pt
                            color: "374151" // gray-700
                        },
                        paragraph: {
                            spacing: { line: 276, before: 120, after: 120 }
                        }
                    },
                },
                paragraphStyles: [
                    {
                        id: "Heading1",
                        name: "Heading 1",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            size: 32, // 16pt
                            bold: true,
                            color: "1e3a8a", // blue-900
                        },
                        paragraph: {
                            spacing: { before: 240, after: 120 },
                        },
                    },
                    {
                        id: "Heading2",
                        name: "Heading 2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            size: 28, // 14pt
                            bold: true,
                            color: "1f2937", // gray-800
                        },
                        paragraph: {
                            spacing: { before: 240, after: 120 },
                        },
                    }
                ]
            },
            sections: [{
                properties: {},
                headers: {
                    default: new Header({
                        children: [
                            new Table({
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                borders: {
                                    top: { style: BorderStyle.NONE, size: 0, color: "ffffff" },
                                    bottom: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" }, // gray-200 border
                                    left: { style: BorderStyle.NONE, size: 0, color: "ffffff" },
                                    right: { style: BorderStyle.NONE, size: 0, color: "ffffff" },
                                    insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "ffffff" },
                                    insideVertical: { style: BorderStyle.NONE, size: 0, color: "ffffff" },
                                },
                                rows: [
                                    new TableRow({
                                        children: [
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new ImageRun({
                                                                data: logoBuffer,
                                                                transformation: { width: 120, height: 40 },
                                                                type: "png"
                                                            }),
                                                        ],
                                                        alignment: AlignmentType.LEFT
                                                    }),
                                                ],
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                                            }),
                                            new TableCell({
                                                children: [
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "İÇ DENETİM RAPORU", bold: true, size: 28, color: "1f2937" }),
                                                        ],
                                                        alignment: AlignmentType.RIGHT,
                                                    }),
                                                ],
                                                width: { size: 50, type: WidthType.PERCENTAGE },
                                                borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                                            })
                                        ]
                                    })
                                ]
                            })
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new TextRun({ text: `${ORG.platformName} Elektronik Raporu | Sayfa `, color: "9ca3af", size: 16 }),
                                    new TextRun({ children: [PageNumber.CURRENT], color: "9ca3af", size: 16 }),
                                    new TextRun({ text: " / ", color: "9ca3af", size: 16 }),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "9ca3af", size: 16 })
                                ]
                            }),
                        ],
                    }),
                },
                children: [
                    new Paragraph({
                        text: "DENETİM ÖZETİ",
                        style: "Heading1",
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Denetim Adı: ", bold: true }),
                            new TextRun({ text: auditData.title || '-' }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Denetim Kodu: ", bold: true }),
                            new TextRun({ text: auditData.auditCode || '-' }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Kapsam: ", bold: true }),
                            new TextRun({ text: auditData.unit?.name || auditData.scope || '-' }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Rapor Tarihi: ", bold: true }),
                            new TextRun({ text: new Date().toLocaleDateString('tr-TR') }),
                        ]
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Genel Denetim Görüşü: ", bold: true }),
                            new TextRun({ text: auditData.opinion || 'Görüş belirtilmemiş', bold: true, color: auditData.opinion?.includes('Olumlu') ? "16a34a" : "ca8a04" }),
                        ]
                    }),
                    new Paragraph({ text: "", spacing: { after: 400 } }),

                    new Paragraph({
                        text: "1. BULGULAR VE İNCELEME SONUÇLARI",
                        style: "Heading2",
                    }),
                    new Paragraph({
                        text: "Bu bölümde gerçekleştirilen denetim testleri sonucunda tespit edilen bulgular ve bunlara ilişkin birim aksiyonları yer almaktadır.",
                        spacing: { after: 200 }
                    }),

                    ...findings.map((f, i) => {
                        const hasConciliation = f.conciliation && Object.keys(f.conciliation).length > 0;
                        const bgColor = f.riskLevel === 'Kritik' ? "fef2f2" : f.riskLevel === 'Yüksek' ? "fef2f2" : "f8fafc";
                        const riskTextColor = f.riskLevel === 'Kritik' ? "991b1b" : f.riskLevel === 'Yüksek' ? "b91c1c" : "0f172a";

                        return new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                                insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e5e7eb" },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            shading: { fill: bgColor },
                                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({ text: `Bulgu No: ${i + 1} | `, bold: true }),
                                                        new TextRun({ text: f.title || 'İsimsiz Bulgu', bold: true }),
                                                    ]
                                                })
                                            ],
                                        }),
                                        new TableCell({
                                            shading: { fill: bgColor },
                                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                            children: [
                                                new Paragraph({
                                                    alignment: AlignmentType.RIGHT,
                                                    children: [
                                                        new TextRun({ text: f.riskLevel || '-', bold: true, color: riskTextColor }),
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            columnSpan: 2,
                                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                                            children: [
                                                new Paragraph({ children: [new TextRun({ text: "MEVCUT DURUM:", bold: true })] }),
                                                new Paragraph({ text: f.description || '-', spacing: { after: 120 } }),
                                                new Paragraph({ children: [new TextRun({ text: "ÖNERİ:", bold: true })] }),
                                                new Paragraph({ text: f.recommendation || '-', spacing: { after: 120 } }),

                                                ...(hasConciliation ? [
                                                    new Paragraph({ children: [new TextRun({ text: "BİRİM CEVABI VE EYLEM PLANI:", bold: true, color: "4338ca" })] }),
                                                    new Paragraph({ text: f.conciliation.response || 'Birim cevabı boş.', spacing: { after: 60 } }),
                                                    new Paragraph({ text: `Aksiyon: ${f.conciliation.actionPlan || '-'}`, spacing: { after: 60 } }),
                                                    new Paragraph({
                                                        children: [
                                                            new TextRun({ text: "Mutabakat Durumu: ", bold: true }),
                                                            new TextRun({
                                                                text: f.conciliation.isAgreed ? "Mutabık Kalındı" : "Mutabakatsız",
                                                                color: f.conciliation.isAgreed ? "16a34a" : "dc2626",
                                                                bold: true
                                                            })
                                                        ]
                                                    })
                                                ] : [
                                                    new Paragraph({ children: [new TextRun({ text: "BİRİM CEVABI: ", bold: true, color: "6b7280" }), new TextRun({ text: "Birim yetkilisi henüz cevaplamadı.", color: "6b7280", italics: true })] }),
                                                ])
                                            ]
                                        })
                                    ]
                                })
                            ]
                        });
                    }),
                    new Paragraph({ text: "", spacing: { after: 600 } }),

                    new Paragraph({ text: "ONAY VE İMZA", style: "Heading2" }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE } },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Müfettiş", bold: true })], alignment: AlignmentType.CENTER }),
                                            new Paragraph({ text: "(Ad Soyad / İmza)", alignment: AlignmentType.CENTER, spacing: { before: 800 } })
                                        ]
                                    }),
                                    new TableCell({
                                        children: [
                                            new Paragraph({ children: [new TextRun({ text: "Denetim Yöneticisi", bold: true })], alignment: AlignmentType.CENTER }),
                                            new Paragraph({ text: "(Ad Soyad / İmza)", alignment: AlignmentType.CENTER, spacing: { before: 800 } })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ],
            }],
        });

        // Generate and Save
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Denetim_Raporu_${auditData.auditCode || 'TASLAK'}.docx`);

    } catch (e: any) {
        console.error("Word report generation failed", e);
        throw new Error("Rapor oluşturulamadı: " + e.message);
    }
};
