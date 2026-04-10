# 📐 KaTeX Matematik Formül Yazım Kılavuzu

Bu rehber, Derslig oyunlarında matematik formüllerini render etmek için kullanılan KaTeX söz dizimini kapsamlı şekilde açıklar.

---

## 🚀 Kullanım Yöntemleri

### 1. `Derslig.math(latex)` — Satır İçi (Inline)
Metin içinde formül göstermek için kullanılır. HTML string döndürür.

```javascript
element.innerHTML = "Sonuç: " + Derslig.math("\\frac{5}{2}");
```

### 2. `Derslig.mathBlock(latex)` — Blok / Display Mod
Büyük, ortalanmış formüller için kullanılır (soru gösterimi gibi).

```javascript
element.innerHTML = Derslig.mathBlock("\\frac{a^2 + b^2}{c}");
```

### 3. `Derslig.renderMath(element)` — Otomatik Render
Bir DOM elementinin içindeki `$...$` (inline) ve `$$...$$` (display) ifadelerini otomatik bulup render eder.

```javascript
soruDiv.textContent = "$\\frac{5}{2}$ ile $\\sqrt{9}$ toplamı kaçtır?";
Derslig.renderMath(soruDiv);
```

---

## 📖 Temel Yazım Kuralları

> **ÖNEMLİ:** JavaScript stringlerinde `\` karakteri kaçış (escape) karakteridir.
> Bu yüzden LaTeX komutlarında `\\` (çift backslash) kullanmalısınız.
> 
> Örnek: `"\\frac{5}{2}"` → ½ kesir olarak render edilir.

---

## 🔢 DÖRT İŞLEM

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Toplama | `5 + 3` | 5 + 3 |
| Çıkarma | `5 - 3` | 5 − 3 |
| Çarpma (×) | `5 \\times 3` | 5 × 3 |
| Çarpma (·) | `5 \\cdot 3` | 5 · 3 |
| Bölme (÷) | `15 \\div 3` | 15 ÷ 3 |

### JavaScript'te:
```javascript
Derslig.math("5 \\times 3 = 15")
Derslig.math("15 \\div 3 = 5")
```

---

## 📊 KESİRLER

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Basit kesir | `\\frac{5}{2}` | ⁵⁄₂ |
| İç içe kesir | `\\frac{\\frac{1}{2}}{3}` | (½)/3 |
| Tam sayılı kesir | `2\\frac{3}{4}` | 2¾ |
| Küçük kesir (inline) | `\\tfrac{1}{2}` | ½ (küçük) |
| Büyük kesir (display) | `\\dfrac{1}{2}` | ½ (büyük) |

### JavaScript'te:
```javascript
Derslig.math("\\frac{5}{2}")          // Satır içi kesir
Derslig.mathBlock("\\frac{5}{2}")     // Büyük kesir
Derslig.math("2\\frac{3}{4}")         // 2 tam 3/4
```

---

## ⬆️ ÜSLER (KUVVETLER)

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Basit üs | `5^{2}` | 5² |
| Çok haneli üs | `2^{10}` | 2¹⁰ |
| Üssün üssü | `2^{3^{2}}` | 2^(3²) |
| İfadeli üs | `(a+b)^{2}` | (a+b)² |
| Negatif üs | `x^{-1}` | x⁻¹ |

### JavaScript'te:
```javascript
Derslig.math("5^{2} = 25")
Derslig.math("2^{10} = 1024")
Derslig.math("(a+b)^{2} = a^{2} + 2ab + b^{2}")
```

---

## ⬇️ ALT İNDİSLER

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Basit alt indis | `x_{1}` | x₁ |
| Çok haneli alt indis | `a_{12}` | a₁₂ |
| Üs + Alt indis birlikte | `x_{1}^{2}` | x₁² |

### JavaScript'te:
```javascript
Derslig.math("x_{1} + x_{2} = x_{3}")
```

---

## √ KÖKLER

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Karekök | `\\sqrt{9}` | √9 |
| Küp kök | `\\sqrt[3]{27}` | ³√27 |
| n. dereceden kök | `\\sqrt[n]{x}` | ⁿ√x |
| İfadeli kök | `\\sqrt{a^{2} + b^{2}}` | √(a²+b²) |

### JavaScript'te:
```javascript
Derslig.math("\\sqrt{9} = 3")
Derslig.math("\\sqrt[3]{27} = 3")
Derslig.math("\\sqrt{a^{2} + b^{2}}")
```

---

## 📐 PARANTEZLER ve GRUPLAMA

| Açıklama | LaTeX Kodu |
|---|---|
| Normal parantez | `(a + b)` |
| Köşeli parantez | `[a + b]` |
| Süslü parantez | `\\{a + b\\}` |
| Otomatik büyüyen parantez | `\\left(\\frac{a}{b}\\right)` |
| Otomatik büyüyen köşeli | `\\left[\\frac{a}{b}\\right]` |
| Otomatik büyüyen süslü | `\\left\\{\\frac{a}{b}\\right\\}` |
| Mutlak değer | `\\left\|x\\right\|` veya `\\lvert x \\rvert` |

### JavaScript'te:
```javascript
Derslig.math("\\left(\\frac{a}{b}\\right)")
Derslig.math("\\left|x - 3\\right| = 5")
```

> **İPUCU:** `\left` ve `\right` komutları parantezleri içerikteki formül yüksekliğine göre otomatik büyütür. Kesir içeren ifadelerde mutlaka kullanın!

---

## ≤ KARŞILAŞTIRMA ve EŞİTSİZLİKLER

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Eşittir | `=` | = |
| Eşit değildir | `\\neq` | ≠ |
| Küçüktür | `<` veya `\\lt` | < |
| Büyüktür | `>` veya `\\gt` | > |
| Küçük eşit | `\\leq` | ≤ |
| Büyük eşit | `\\geq` | ≥ |
| Yaklaşık eşit | `\\approx` | ≈ |
| Orantılı | `\\propto` | ∝ |

### JavaScript'te:
```javascript
Derslig.math("5 \\leq x \\leq 10")
Derslig.math("\\pi \\approx 3.14")
```

---

## 🔤 YUNAN HARFLERİ

| Küçük Harf | Kod | Büyük Harf | Kod |
|---|---|---|---|
| α (alfa) | `\\alpha` | Α | `A` |
| β (beta) | `\\beta` | Β | `B` |
| γ (gama) | `\\gamma` | Γ | `\\Gamma` |
| δ (delta) | `\\delta` | Δ | `\\Delta` |
| ε (epsilon) | `\\epsilon` | | |
| θ (teta) | `\\theta` | Θ | `\\Theta` |
| λ (lambda) | `\\lambda` | Λ | `\\Lambda` |
| μ (mü) | `\\mu` | | |
| π (pi) | `\\pi` | Π | `\\Pi` |
| σ (sigma) | `\\sigma` | Σ | `\\Sigma` |
| φ (fi) | `\\phi` | Φ | `\\Phi` |
| ω (omega) | `\\omega` | Ω | `\\Omega` |

### JavaScript'te:
```javascript
Derslig.math("\\pi \\approx 3.14159")
Derslig.math("\\Delta = b^{2} - 4ac")
```

---

## ∑ TOPLAM, ÇARPIM ve LİMİT

| Açıklama | LaTeX Kodu |
|---|---|
| Toplam (Sigma) | `\\sum_{i=1}^{n} i` |
| Çarpım (Pi) | `\\prod_{i=1}^{n} i` |
| Limit | `\\lim_{x \\to \\infty} f(x)` |
| Sonsuzluk | `\\infty` |

### JavaScript'te:
```javascript
Derslig.mathBlock("\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}")
Derslig.math("\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1")
```

---

## ∫ İNTEGRAL

| Açıklama | LaTeX Kodu |
|---|---|
| Belirsiz integral | `\\int f(x)\\,dx` |
| Belirli integral | `\\int_{a}^{b} f(x)\\,dx` |
| Çift integral | `\\iint f(x,y)\\,dx\\,dy` |

### JavaScript'te:
```javascript
Derslig.mathBlock("\\int_{0}^{1} x^{2}\\,dx = \\frac{1}{3}")
```

---

## 📏 GEOMETRİ

| Açıklama | LaTeX Kodu | Görünüm |
|---|---|---|
| Açı | `\\angle ABC` | ∠ABC |
| Derece | `90^{\\circ}` | 90° |
| Paralel | `AB \\parallel CD` | AB ∥ CD |
| Dik | `AB \\perp CD` | AB ⊥ CD |
| Üçgen | `\\triangle ABC` | △ABC |
| Benzer | `\\sim` | ∼ |
| Eş | `\\cong` | ≅ |

### JavaScript'te:
```javascript
Derslig.math("\\angle ABC = 90^{\\circ}")
Derslig.math("\\triangle ABC \\sim \\triangle DEF")
```

---

## 🧮 MATRİSLER

| Açıklama | LaTeX Kodu |
|---|---|
| Parantezli matris | `\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}` |
| Köşeli matris | `\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}` |
| Determinant | `\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}` |

### JavaScript'te:
```javascript
Derslig.mathBlock("\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}")
Derslig.mathBlock("\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}")
```

> **NOT:** Matrislerde satır sonu için `\\\\` (4 backslash - JS'de) kullanılır.

---

## 🔀 PARÇALI FONKSİYONLAR

```javascript
Derslig.mathBlock("f(x) = \\begin{cases} x^{2} & x \\geq 0 \\\\ -x & x < 0 \\end{cases}")
```

Bu şu şekilde görünür:
```
         ⎧ x²    x ≥ 0
f(x) =  ⎨
         ⎩ -x    x < 0
```

---

## 📝 METİN ve FORMATLAR

| Açıklama | LaTeX Kodu |
|---|---|
| Formül içinde metin | `x \\text{ ise } y` |
| Kalın | `\\mathbf{F}` |
| İtalik (değişken) | `\\mathit{velocity}` |
| Roman (düz) | `\\mathrm{cm}` |
| Boşluk (ince) | `a\\,b` |
| Boşluk (orta) | `a\\;b` |
| Boşluk (kalın) | `a\\quad b` |
| Boşluk (çok kalın) | `a\\qquad b` |

### JavaScript'te:
```javascript
Derslig.math("v = 5 \\; \\mathrm{m/s}")
Derslig.math("F = m \\cdot a \\text{ (Newton Yasası)}")
```

---

## 🎨 RENK

| Açıklama | LaTeX Kodu |
|---|---|
| Kırmızı metin | `\\textcolor{red}{ifade}` |
| Mavi metin | `\\textcolor{blue}{ifade}` |
| Yeşil metin | `\\textcolor{green}{ifade}` |
| Hex renk | `\\textcolor{#E50069}{ifade}` |
| Kutu (çerçeveli) | `\\boxed{ifade}` |

### JavaScript'te:
```javascript
Derslig.math("\\textcolor{red}{x} + \\textcolor{blue}{y} = \\textcolor{green}{z}")
Derslig.math("\\boxed{x = \\frac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}}")
```

---

## 🏆 SIK KULLANILAN FORMÜLLER

### İlkokul Seviyesi
```javascript
// Toplama
Derslig.math("24 + 37 = 61")

// Çarpma
Derslig.math("6 \\times 8 = 48")

// Bölme
Derslig.math("56 \\div 7 = 8")

// Basit kesir
Derslig.math("\\frac{1}{2} + \\frac{1}{4} = \\frac{3}{4}")
```

### Ortaokul Seviyesi
```javascript
// Denklem
Derslig.math("3x + 5 = 20")

// Üslü ifade
Derslig.math("2^{5} = 32")

// Karekök
Derslig.math("\\sqrt{144} = 12")

// Oran-Orantı
Derslig.math("\\frac{x}{3} = \\frac{12}{9}")

// Yüzde
Derslig.math("\\%25 \\text{ of } 80 = 20")

// Açı
Derslig.math("\\angle A + \\angle B + \\angle C = 180^{\\circ}")
```

### Lise Seviyesi
```javascript
// İkinci derece denklem formülü
Derslig.mathBlock("x = \\frac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}")

// Logaritma
Derslig.math("\\log_{2} 8 = 3")

// Trigonometri
Derslig.math("\\sin^{2}\\theta + \\cos^{2}\\theta = 1")

// Türev
Derslig.math("\\frac{d}{dx}(x^{n}) = nx^{n-1}")

// Faktöriyel
Derslig.math("n! = n \\times (n-1) \\times \\cdots \\times 1")

// Kombinasyon
Derslig.math("\\binom{n}{k} = \\frac{n!}{k!(n-k)!}")

// Limit
Derslig.mathBlock("\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^{n} = e")
```

---

## ⚙️ SCORM PAKETLERİNDE KULLANIM

SCORM paketlerinde KaTeX CDN'den yüklenir. Bu yüzden:
- İnternete erişebilen LMS sistemlerinde sorunsuz çalışır.
- Tamamen offline ortam gerekiyorsa, KaTeX dosyalarını (`katex.min.css`, `katex.min.js`, `auto-render.min.js` ve `fonts/` klasörü) `assets/vendor/katex/` altına indirilip yollar güncellenmelidir.

---

## 💡 İPUÇLARI

1. **JavaScript'te çift backslash:** `\frac` → `"\\frac"` olarak yazılmalı.
2. **Süslü parantezle gruplama:** Birden fazla karakter üs/alt indis ise `{}` ile grupla: `x^{12}` (doğru) vs `x^12` (sadece 1 üs olur).
3. **Display vs Inline:** Büyük formüller (soru gösterimi) için `mathBlock()`, seçenek/metin içi için `math()` kullan.
4. **Auto-render:** Veri dosyalarında `$...$` syntax'ı kullanıp JS'de `Derslig.renderMath(container)` ile toplu render yapabilirsin.
5. **Hata yönetimi:** Yanlış LaTeX yazılırsa KaTeX hata vermez, kırmızı renkle hatalı kısmı gösterir (`throwOnError: false`).
