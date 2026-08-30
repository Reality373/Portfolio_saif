# Security Utilities (CyberHexon ZeroByte & VulnScan) — Forensic Engineering War Stories & Retrospectives

---

### 1. NIST SP 800-88 Rev.1 Media Sanitization & Cryptographically Signed Wipe Verification

- **Category:** Defensive Engineering & Security / Cryptographic Verification
- **Key Metrics / Impact:** Automated compliance with NIST SP 800-88 Rev.1 / DoD 5220.22-M data sanitization standards | RSA-2048 / SHA-256 digital signature certificate generation with embedded QR codes | Raw physical drive sector overwriting with sample hash verification
- **Tech Stack & Hardware Involved:** Python, ReportLab PDF Canvas, Cryptography (RSA-2048 PKCS#1 v1.5), `qrcode`, PySide6 / PyQt GUI, Windows WMI (`Win32_DiskDrive`), `DeviceIoControl` / Linux `BLKDISCARD`

#### 1. The Situation & Setup
`ZeroByte` (`ZeroByte/cyberhexon_windows/`) was developed as an enterprise storage sanitization platform (branded CyberHexon) to securely erase magnetic hard drives (HDDs), solid-state drives (SSDs), and NVMe media prior to decommissioning (`main.py`, `wipe_engine.py`). Beyond overwriting raw sectors, enterprise IT asset disposition (ITAD) requires legally defensible, tamper-proof proof of destruction compliant with NIST SP 800-88 Rev.1 standards (`certificate.py`).

#### 2. The Anomaly & The Mistake (The Symptom)
1. **Unverifiable Data Purges:** Simple file deletions or partition table removals leave recoverable magnetic and flash data; without cryptographic audit trails, compliance officers cannot verify whether multi-pass overwrites actually took place.
2. **PDF Certificate Tampering:** Standard generated disposal PDFs can easily be modified using PDF editors by rogue operators to claim a drive was sanitized when it was merely formatted.
3. **Physical vs Logical Drive Enumeration Conflicts:** In Windows, querying drive letters (`C:\`, `D:\`) misses unpartitioned storage or corrupted drive volumes, while attempting to open `\\.\PhysicalDrive0` without locking volumes triggers OS sharing violations (`ERROR_SHARING_VIOLATION`).

#### 3. Forensic Investigation (The Root Cause)
1. **Lack of Cryptographic Non-Repudiation:** A valid certificate of destruction must bind the physical hardware serial numbers, wipe algorithm, timestamp, and verification hash to an asymmetric private key held by the compliance appliance.
2. **Drive Mapping Hierarchy:** Windows structures storage across three distinct WMI classes: `Win32_DiskDrive` (physical silicon/spindle), `Win32_DiskPartition` (MBR/GPT structures), and `Win32_LogicalDisk` (filesystem mount points). Enumeration must traverse associative relationship classes (`Win32_LogicalDiskToPartition`) to correlate drive letters with physical device handles.

#### 4. The Engineering Breakthrough (The Fix)
The system was architected with a 4-phase sanitization engine and asymmetric certificate pipeline (`certificate.py` and `wipe_engine.py`):
1. **4-Phase Sanitization Engine (`wipe_engine.py`):**
   - **Phase 1: Drive Locking & Pre-Flight:** Dismounts logical volumes and queries raw physical geometry.
   - **Phase 2: Multi-Pass Sector Purge:** Overwrites physical blocks using NIST Clear/Purge patterns (zero-fill, random noise, complement patterns).
   - **Phase 3: Sample Hash Verification:** Reads pseudo-random sector samples across the storage geometry, computing a cumulative SHA-256 verification digest.
   - **Phase 4: Finalization:** Generates audit metadata records.
2. **RSA-2048 Asymmetric Digital Signatures (`certificate.py`):** The audit summary is serialized into canonical JSON, signed with an RSA-2048 private key via PKCS#1 v1.5 and SHA-256, and embedded into a structured ReportLab PDF.
3. **Machine-Readable QR Code Verification:** Encodes the signature hash into a verification URI (`CyberHexon://signed/{sig_hex[:32]}`) stamped directly onto the PDF certificate, allowing auditors to verify authenticity with mobile scanners.

#### 5. The Core Engineering Lesson
In data destruction engineering, data erasure is only as valuable as the cryptographic audit trail proving it occurred. Always pair raw physical sector purging with cryptographically signed, machine-verifiable certificates of destruction.

#### 6. Representative Code / Circuit Logic

```python
# Excerpt from: ZeroByte/cyberhexon_windows/certificate.py

class CertificateGenerator:
    def _sign(self, data: bytes) -> bytes:
        return self._private_key.sign(
            data,
            padding.PKCS1v15(),
            hashes.SHA256()
        )

    def generate(self, summary_dict, out_pdf_path, out_json_path):
        payload = {
            "product": "CyberHexon",
            "spec": "NIST SP 800-88 Rev.1 (Media Sanitization)",
            "summary": summary_dict
        }
        payload_bytes = json.dumps(payload, indent=2).encode("utf-8")
        signature = self._sign(payload_bytes)

        # Generate QR code linking to digital signature
        qr_payload = f"CyberHexon://signed/{signature.hex()[:32]}"
        qr_img = qrcode.make(qr_payload)
        qr_path = str(out_pdf_path) + "_qr.png"
        qr_img.save(qr_path)

        # Draw verified PDF certificate with ReportLab Canvas
        self._draw_certificate(summary_dict, qr_path, out_pdf_path)
        return out_pdf_path, out_json_path
```

---

### 2. Multi-Tiered Physical Drive Enumeration & Volume Dismounting

- **Category:** Architecture & Paradigm Shifts / Systems Programming
- **Key Metrics / Impact:** 100% reliable physical drive discovery across Windows WMI | Dynamic correlation of physical disk handles with mounted logical drive letters
- **Tech Stack & Hardware Involved:** Python, Windows WMI (`win32com.client`), `wmi` library, Windows Storage Architecture

#### 1. The Situation & Setup
`drives.py` is the hardware abstraction module responsible for enumerating all attached physical storage devices, identifying removable USB flash drives, external NVMe enclosures, and internal SATA hard drives without endangering the active Windows OS drive (`C:\`).

#### 2. The Anomaly & The Mistake (The Symptom)
1. **OS Drive Accidental Selection Risk:** In early builds, drive lists simply showed drive letters (`C:`, `D:`, `E:`). Users could easily select the active system partition by mistake.
2. **Missing Unpartitioned Drives:** If a target USB drive had a corrupted partition table or unformatted raw partition, filesystem-based scanning failed to detect the drive entirely.

#### 3. Forensic Investigation (The Root Cause)
1. **Filesystem vs Physical Drive Abstraction:** Scanning drives using `os.listdrives()` only returns mounted filesystems with drive letters. A drive with deleted partition tables exists physically (`\\.\PhysicalDrive1`) but has zero logical volumes.
2. **Associative WMI Traversal:** Mapping a physical disk device ID (`\\.\PHYSICALDRIVE1`) to its user-facing drive letter (`E:`) requires traversing the WMI associative class `Win32_DiskDriveToDiskPartition` and `Win32_LogicalDiskToPartition`.

#### 4. The Engineering Breakthrough (The Fix)
The enumeration layer was rebuilt using multi-tier WMI queries (`ZeroByte/cyberhexon_windows/drives.py`):
1. **Physical-First Enumeration:** Queries `Win32_DiskDrive` to get the raw hardware device ID, model, serial number, and size in bytes.
2. **Associative Volume Mapping:** Traverses dependent partitions to correlate drive letters, actively flagging the system drive (`is_system: True` for the partition hosting `C:\Windows`) to disable accidental deletion.
3. **Raw Device Access Readiness:** Exposes physical device handles (`\\.\PhysicalDriveX`) for direct block-level zeroing regardless of partition integrity.

#### 5. The Core Engineering Lesson
Disk management tools must always operate from the physical layer upwards. Never enumerate logical drive letters when sanitizing media; query physical hardware IDs first, map logical volumes second, and aggressively lock the system drive from destructive operations.
