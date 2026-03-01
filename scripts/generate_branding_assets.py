#!/usr/bin/env python3
"""Generate resized DTA Craft logo/icon PNG assets without external dependencies."""

from __future__ import annotations

import argparse
import struct
import zlib
from pathlib import Path

PNG_SIG = b"\x89PNG\r\n\x1a\n"


def paeth_predictor(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def parse_png(path: Path) -> tuple[int, int, bytearray]:
    data = path.read_bytes()
    if not data.startswith(PNG_SIG):
        raise ValueError(f"{path} is not a PNG file")

    pos = len(PNG_SIG)
    width = height = None
    bit_depth = color_type = None
    idat = bytearray()

    while pos < len(data):
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        pos += 4
        ctype = data[pos : pos + 4]
        pos += 4
        chunk = data[pos : pos + length]
        pos += length
        _crc = data[pos : pos + 4]
        pos += 4

        if ctype == b"IHDR":
            width, height, bit_depth, color_type, comp, filt, interlace = struct.unpack(">IIBBBBB", chunk
            )
            if bit_depth != 8 or color_type != 6:
                raise ValueError(
                    f"Only 8-bit RGBA PNG is supported. Got bit_depth={bit_depth}, color_type={color_type}"
                )
            if comp != 0 or filt != 0 or interlace != 0:
                raise ValueError("Unsupported PNG compression/filter/interlace format")
        elif ctype == b"IDAT":
            idat.extend(chunk)
        elif ctype == b"IEND":
            break

    if width is None or height is None:
        raise ValueError("Invalid PNG: missing IHDR")

    raw = zlib.decompress(bytes(idat))
    bpp = 4
    stride = width * bpp
    out = bytearray(height * stride)

    src_pos = 0
    for y in range(height):
        filter_type = raw[src_pos]
        src_pos += 1
        scan = bytearray(raw[src_pos : src_pos + stride])
        src_pos += stride

        prev_row_offset = (y - 1) * stride
        row_offset = y * stride

        if filter_type == 0:
            pass
        elif filter_type == 1:
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                scan[i] = (scan[i] + left) & 0xFF
        elif filter_type == 2:
            for i in range(stride):
                up = out[prev_row_offset + i] if y > 0 else 0
                scan[i] = (scan[i] + up) & 0xFF
        elif filter_type == 3:
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                up = out[prev_row_offset + i] if y > 0 else 0
                scan[i] = (scan[i] + ((left + up) // 2)) & 0xFF
        elif filter_type == 4:
            for i in range(stride):
                left = scan[i - bpp] if i >= bpp else 0
                up = out[prev_row_offset + i] if y > 0 else 0
                up_left = out[prev_row_offset + i - bpp] if (y > 0 and i >= bpp) else 0
                scan[i] = (scan[i] + paeth_predictor(left, up, up_left)) & 0xFF
        else:
            raise ValueError(f"Unsupported PNG filter type: {filter_type}")

        out[row_offset : row_offset + stride] = scan

    return width, height, out


def bilinear_resize(src: bytearray, sw: int, sh: int, dw: int, dh: int) -> bytearray:
    if sw == dw and sh == dh:
        return bytearray(src)

    dst = bytearray(dw * dh * 4)

    for y in range(dh):
        gy = (y + 0.5) * sh / dh - 0.5
        y0 = int(gy)
        y1 = min(y0 + 1, sh - 1)
        wy = gy - y0
        y0 = max(0, y0)

        for x in range(dw):
            gx = (x + 0.5) * sw / dw - 0.5
            x0 = int(gx)
            x1 = min(x0 + 1, sw - 1)
            wx = gx - x0
            x0 = max(0, x0)

            i00 = (y0 * sw + x0) * 4
            i10 = (y0 * sw + x1) * 4
            i01 = (y1 * sw + x0) * 4
            i11 = (y1 * sw + x1) * 4

            o = (y * dw + x) * 4
            for c in range(4):
                v00 = src[i00 + c]
                v10 = src[i10 + c]
                v01 = src[i01 + c]
                v11 = src[i11 + c]
                v0 = v00 + (v10 - v00) * wx
                v1 = v01 + (v11 - v01) * wx
                v = v0 + (v1 - v0) * wy
                dst[o + c] = max(0, min(255, int(round(v))))

    return dst


def write_png(path: Path, width: int, height: int, rgba: bytearray) -> None:
    stride = width * 4
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # filter type None
        row_start = y * stride
        raw.extend(rgba[row_start : row_start + stride])

    compressed = zlib.compress(bytes(raw), level=9)

    def chunk(name: bytes, payload: bytes) -> bytes:
        crc = zlib.crc32(name + payload) & 0xFFFFFFFF
        return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", crc)

    png = bytearray(PNG_SIG)
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))
    path.write_bytes(png)


def render_contain_square(src: bytearray, sw: int, sh: int, size: int) -> bytearray:
    scale = min(size / sw, size / sh)
    tw = max(1, int(round(sw * scale)))
    th = max(1, int(round(sh * scale)))
    resized = bilinear_resize(src, sw, sh, tw, th)

    out = bytearray(size * size * 4)
    ox = (size - tw) // 2
    oy = (size - th) // 2

    for y in range(th):
        src_row = y * tw * 4
        dst_row = ((y + oy) * size + ox) * 4
        out[dst_row : dst_row + tw * 4] = resized[src_row : src_row + tw * 4]
    return out


def render_logo_width(src: bytearray, sw: int, sh: int, target_width: int) -> tuple[int, int, bytearray]:
    target_height = max(1, int(round(sh * target_width / sw)))
    return target_width, target_height, bilinear_resize(src, sw, sh, target_width, target_height)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate DTA Craft logo/icon assets from a source PNG")
    parser.add_argument("--source", default="dtacraft-site/assets/logo.png", help="Path to source RGBA PNG")
    parser.add_argument("--output", default=".generated/branding", help="Output directory (kept out of git by default)")
    args = parser.parse_args()

    source = Path(args.source)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)

    sw, sh, src = parse_png(source)

    logo_widths = [2048, 1024, 512, 256]
    icon_sizes = [512, 192, 180, 32, 16]

    for w in logo_widths:
        lw, lh, logo = render_logo_width(src, sw, sh, w)
        write_png(output / f"dta-logo-{w}.png", lw, lh, logo)

    for s in icon_sizes:
        icon = render_contain_square(src, sw, sh, s)
        write_png(output / f"dta-icon-{s}.png", s, s, icon)

    print(f"Generated {len(logo_widths) + len(icon_sizes)} assets in {output}")
    print("Note: binary files are intentionally generated outside tracked site assets.")
    print("If needed, upload selected PNGs manually after PR creation.")


if __name__ == "__main__":
    main()
