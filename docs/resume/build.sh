#!/usr/bin/env bash
# Build LaTeX Resumes (Base + 6 Tailored Domain Resumes)
set -u
export PATH="$HOME/texlive/2026/bin/x86_64-linux:$PATH"
export PERL5LIB="${PERL5LIB:-}:$HOME/perl5/lib"
export TEXFORMATS="$HOME/texlive/2026/texmf-var/web2c/pdftex:"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PUBLIC_DIR="$ROOT_DIR/public"
PUBLIC_RESUMES_DIR="$PUBLIC_DIR/resumes"

mkdir -p "$PUBLIC_RESUMES_DIR"

compile_tex() {
  local src_path="$1"
  local dest_name="$2"
  local dir_name="$(dirname "$src_path")"
  local base_name="$(basename "$src_path" .tex)"

  cd "$dir_name"
  rm -f "${base_name}.aux" "${base_name}.log" "${base_name}.out"

  echo "--- Compiling $base_name.tex ---"
  if ! pdflatex -interaction=nonstopmode "${base_name}.tex" > /dev/null 2>&1; then
    echo "pdflatex reported an issue on $base_name.tex:"
    grep -E "^! |^l\.[0-9]+|LaTeX Error|Package .* Error|not found" "${base_name}.log" | head -20
    return 1
  fi

  if [ ! -f "${base_name}.pdf" ]; then
    echo "NO PDF PRODUCED for $base_name.tex"
    return 1
  fi

  python3 -c "
import re
d=open('${base_name}.log',encoding='utf8',errors='ignore').read()
m=re.search(r'Output written on ${base_name}\.pdf \((\d+) pages?',d)
pages = m.group(1) if m else '?'
w=re.findall(r'Overfull \\\\hbox',d)
print('  Result: Pages:', pages, '| Overfull hboxes:', len(w))"

  cp -f "${base_name}.pdf" "$PUBLIC_RESUMES_DIR/${dest_name}.pdf"
  echo "  Copied -> public/resumes/${dest_name}.pdf"
}

# 1. Base / Core Resume
compile_tex "$SCRIPT_DIR/resume.tex" "Saif_Shikalgar_Resume"
cp -f "$SCRIPT_DIR/resume.pdf" "$PUBLIC_DIR/resume.pdf"

# 2. Tailored Resumes
compile_tex "$SCRIPT_DIR/tailored/resume_web_dev.tex" "Saif_Shikalgar_Web_Dev"
compile_tex "$SCRIPT_DIR/tailored/resume_android.tex" "Saif_Shikalgar_Android"
compile_tex "$SCRIPT_DIR/tailored/resume_automotive_cybersecurity.tex" "Saif_Shikalgar_Automotive_Cybersecurity"
compile_tex "$SCRIPT_DIR/tailored/resume_cybersecurity.tex" "Saif_Shikalgar_Cybersecurity"
compile_tex "$SCRIPT_DIR/tailored/resume_robotics.tex" "Saif_Shikalgar_Robotics"
compile_tex "$SCRIPT_DIR/tailored/resume_embedded_systems.tex" "Saif_Shikalgar_Embedded_Systems"

echo ""
echo "=== All 7 Resumes Built Successfully! ==="
ls -lh "$PUBLIC_RESUMES_DIR"
