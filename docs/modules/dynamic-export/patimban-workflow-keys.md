# AGL Patimban (client 566/449) — real workflow milestone keys

Source: production stop-workflow detail (GET /v1/stop-workflows/:id), 6 workflows.
Used to build patimban-export / patimban-import export templates.

## EXPORT flow — 3 stops
- stopIndex 0 = Depo   (wf "Pickup Kontainer Kosong di Depo (EKSPOR)" 596b8da0)
- stopIndex 1 = Customer(wf "Pickup Customer Muat (EKSPOR)" a7ecefb8)
- stopIndex 2 = Pelabuhan(wf "Drop Off (EKSPOR)" 9f7c24bf)

Milestone_ts columns (exim EXPORT):
| Sheet label | stopIndex | key |
|---|---|---|
| Antri Gate-in Depo | 0 | antriGateInDepo |
| Gate-in Depo | 0 | gateInDepo |
| Gate-out Depo | 0 | gateOutDepo |
| Gate-in Customer | 1 | gateInCustomer |
| Gate-out Customer | 1 | gateOutCustomer |
| Antri Gate-in Pelabuhan | 2 | antriGateInPelabuhan |
| Gate-in Pelabuhan | 2 | gateInPelabuhan |
| Gate-out Pelabuhan | 2 | gateOutPelabuhan |

Container/Seal (Depo, stop 0): muatKontainerKosong.tulisNomorKontainer ; fotoEirSegelSeal.tulisNomorSegelSeal

## IMPORT flow — 3 stops
- stopIndex 0 = Pelabuhan/Terminal (wf "Pickup Muat Kontainer di Terminal (IMPOR)" 8d817c0f)
- stopIndex 1 = Customer (wf "Drop Off & Pickup Empty (IMPOR)" b6f66e29)
- stopIndex 2 = Pelabuhan return (wf "Drop Off Kontainer Kosong di Pelabuhan" a4353de3)

Milestone_ts columns (exim IMPORT):
| Sheet label | stopIndex | key |
|---|---|---|
| Antri Gate Pass | 0 | antriGatePass |
| Gate-in Pelabuhan | 0 | gateInPelabuhan |
| Gate-out Pelabuhan | 0 | gateOutPelabuhan |
| Antri Gate-in Customer | 1 | antriGateInCostumer |
| Gate-in Customer | 1 | gateInCustomer |
| Gate-out Customer | 1 | gateOutCustomer |
| Antri Gate-in Pelabuhan | 2 | antriGateInPelabuhan |
| Gate-in Pelabuhan (CY) | 2 | gateInPelabuhanCy |
| Gate-out Pelabuhan | 2 | gateOutPelabuhan |

Container number (Import): stop0 fotoKontainerSetelahMuat.tulisNomerContainer (note spelling 'Nomer'); stop1 muatKontainerKosong.masukkanNomorKontainerTulisKalauTidakDapatKontainer (NUMBER)

## Both templates end with document columns (source: 'document'):
- Dok Surat Jalan -> official_documents.surat_jalan.url
- Dok EIR -> official_documents.eir.url
