# /// script
# requires-python = ">=3.10"
# dependencies = ["fonttools==4.67.0", "brotli==1.2.0"]
# ///
"""Recria a fonte local sem o componente vazio de U+00A0 (aviso do Firefox)."""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import Glyph

root = Path(__file__).resolve().parent.parent
source = root / "node_modules/@fontsource-variable/roboto-mono/files/roboto-mono-latin-wght-normal.woff2"
target = root / "public/fonts/roboto-mono-latin.woff2"
font = TTFont(source, recalcTimestamp=False)
name = font.getBestCmap()[0xA0]
glyph = font["glyf"][name]
# Não altera contornos, métricas ou deltas de uma nova versão desconhecida.
if not (glyph.isComposite() and len(glyph.components) == 1
        and font["glyf"][glyph.components[0].glyphName].numberOfContours == 0
        and not font["gvar"].variations.get(name)):
    raise RuntimeError("A estrutura da fonte mudou; revise a normalização de U+00A0.")
font["glyf"][name] = Glyph()
font.save(target)
print(f"Fonte preparada: {target.relative_to(root)} (U+00A0 com métricas preservadas)")
