#!/usr/bin/env bash
# Build the LaTeX Resume and copy to public/
set -u
export PATH="$HOME/texlive/2026/bin/x86_64-linux:$PATH"
export PERL5LIB="${PERL5LIB:-}:$HOME/perl5/lib"
export TEXFORMATS="$HOME/texlive/2026/texmf-var/web2c/pdftex:"

cd "$(dirname "$0")"
rm -f resume.aux resume.log resume.out

echo "--- Compiling resume.tex with pdflatex ---"
if ! pdflatex -interaction=nonstopmode resume.tex > /dev/null 2>&1; then
  echo "pdflatex reported an issue:"
  grep -E "^! |^l\.[0-9]+|LaTeX Error|Package .* Error|not found" resume.log | head -20
  exit 1
fi

if [ ! -f resume.pdf ]; then
  echo "NO PDF PRODUCED"
  exit 1
fi

echo "--- Built resume.pdf successfully ---"
python3 -c "
import re
d=open('resume.log',encoding='utf8',errors='ignore').read()
m=re.search(r'Output written on resume\.pdf \((\d+) pages?',d)
print('Pages:', m.group(1) if m else '?')
w=re.findall(r'Overfull \\\\hbox',d)
print('Overfull hboxes:', len(w))"

# Copy to public/ for web downloads
cp -f resume.pdf ../../public/resume.pdf
echo "Copied to ../../public/resume.pdf"
