#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

kind="${1:-}"
refresh=0
for arg in "${@:2}"; do
  case "$arg" in
    --refresh) refresh=1 ;;
    *) echo "unknown flag: $arg"; exit 1 ;;
  esac
done

site="https://www.dndbeyond.com"
case "$kind" in
  classes) listing="$site/classes"; path="classes"; one="class" ;;
  *) echo "usage: scripts/reference.sh <classes> [--refresh]"; exit 1 ;;
esac

root="reference/dndbeyond/$path"
agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
driver=""
pw() { /opt/homebrew/bin/playwright-cli -s=reference --raw "$@" 2>/dev/null; }

refused() {
  [ "$1" = 403 ] || [ "$1" = 429 ] || [ "$1" = 503 ] || grep -qiE '<title>(just a moment|access denied)' "$2"
}

page() {
  local url="$1" out="$2" code
  if [ "$driver" != "playwright" ]; then
    code="$(curl -sS -L -A "$agent" -o "$out" -w '%{http_code}' "$url")" || code=000
    if ! refused "$code" "$out"; then
      [ -n "$driver" ] || { driver=curl; echo "driver: curl"; }
      [ "$code" = 200 ] || { echo "$url answered $code"; return 1; }
      return 0
    fi
    [ -z "$driver" ] || { echo "$url answered $code under curl"; return 1; }
    driver=playwright
    echo "driver: playwright-cli, curl was refused with $code"
    pw open "$url" >/dev/null
  else
    pw goto "$url" >/dev/null
  fi
  pw eval "document.documentElement.outerHTML" | jq -r . > "$out"
}

image() {
  local url="$1" out="$2"
  if [ "$driver" = playwright ]; then
    pw eval "fetch('$url').then(r => r.blob()).then(b => new Promise(done => { const f = new FileReader(); f.onload = () => done(f.result.split(',')[1]); f.readAsDataURL(b) }))" | jq -r . | base64 -d > "$out"
  else
    curl -sS -L -A "$agent" -o "$out" "$url"
  fi
}

markdown() {
  awk '
    /class="content-container"/ { on = 1 }
    /class="p-comments"/ { on = 0 }
    on { gsub(/</, "\n<"); gsub(/>/, ">\n"); print }
  ' "$1" | awk '
    function flush(   text) {
      text = buf; buf = ""
      text = trim(text)
      if (text == "") return
      if (quote) text = "> " text
      print text; print ""
    }
    function item(   i, prefix) {
      buf = trim(buf)
      if (buf == "") return
      prefix = ""
      for (i = 1; i < depth; i++) prefix = prefix "  "
      if (kind[depth] == "ol") { count[depth]++; prefix = prefix count[depth] ". " } else prefix = prefix "- "
      print prefix buf; buf = ""
    }
    function trim(s) { gsub(/  +/, " ", s); gsub(/\*\* \*/, "***", s); gsub(/\* \*\*/, "***", s); sub(/^ /, "", s); sub(/ $/, "", s); return s }
    function attr(name,   s) {
      if (match($0, name "=\"[^\"]*\"")) { s = substr($0, RSTART + length(name) + 2, RLENGTH - length(name) - 3); return s }
      return ""
    }
    function basename(url) { sub(/\?.*$/, "", url); sub(/^.*\//, "", url); return url }
    /^</ {
      match($0, /^<\/?[a-zA-Z0-9]+/)
      tag = tolower(substr($0, RSTART + 1, RLENGTH - 1))
      ending = 0
      if (substr(tag, 1, 1) == "/") { ending = 1; tag = substr(tag, 2) }
      if (skip) {
        if (tag == skiptag) { if (ending) { skipdepth--; if (skipdepth == 0) skip = 0 } else skipdepth++ }
        next
      }
      if (!ending && (tag == "script" || tag == "style" || tag == "noscript" || tag == "select" || (tag == "span" && $0 ~ /class="badge"/) || (tag == "div" && $0 ~ /create-character-button/))) { skip = 1; skiptag = tag; skipdepth = 1; next }
      if (tag ~ /^h[1-6]$/) {
        if (ending) { buf = trim(buf); if (buf != "") { print substr("######", 1, level) " " buf; print "" } buf = ""; level = 0 }
        else { flush(); level = substr(tag, 2) + 0 }
        next
      }
      if (tag == "img") {
        src = attr("data-src"); if (src == "") src = attr("src")
        if (src == "") next
        if (src ~ /^\/\//) src = "https:" src
        else if (src ~ /^\//) src = "https://www.dndbeyond.com" src
        alt = attr("alt")
        print src > images
        if (incell) buf = buf " ![" alt "](" basename(src) ")"
        else { flush(); print "![" alt "](" basename(src) ")"; print "" }
        next
      }
      if (tag == "br") { buf = buf (incell ? " " : "\n"); next }
      if (tag == "hr") { flush(); print "---"; print ""; next }
      if (tag == "strong" || tag == "b") { buf = buf "**"; next }
      if (tag == "em" || tag == "i") { buf = buf "*"; next }
      if (tag == "table") { if (ending) { intable = 0; print "" } else { flush(); intable = 1; rows = 0; sawhead = 0; inhead = 0 } next }
      if (tag == "thead") { if (!ending) { inhead = 1; sawhead = 1; headrows = 0 } else { inhead = 0; if (headrows == 0) sawhead = 0; else { line = "|"; for (i = 1; i <= headcols; i++) line = line "---|"; print line } } next }
      if (tag == "tr") { if (!ending) { cells = 0; buf = "" } else {
          line = "|"; for (i = 1; i <= cells; i++) line = line " " cell[i] " |"
          print line; rows++
          if (inhead) { headrows++; if (cells > headcols) headcols = cells } else if (!sawhead && rows == 1) { line = "|"; for (i = 1; i <= cells; i++) line = line "---|"; print line }
        } next }
      if (tag == "th" || tag == "td") {
        if (!ending) { incell = 1; buf = ""; span = attr("colspan") + 0; if (span < 1) span = 1 }
        else { incell = 0; buf = trim(buf); gsub(/\|/, "\\|", buf); cells++; cell[cells] = buf; for (i = 1; i < span; i++) { cells++; cell[cells] = "" } buf = "" }
        next
      }
      if (incell) next
      if (tag == "ul" || tag == "ol") {
        if (ending) { depth--; if (depth == 0) print "" }
        else { if (depth > 0) item(); else flush(); depth++; kind[depth] = tag; count[depth] = 0 }
        next
      }
      if (tag == "li") { if (ending) item(); else if (buf != "") item(); next }
      if (tag == "blockquote" || tag == "aside") { flush(); quote = !ending; if (ending) print ""; next }
      if (tag == "p" || tag == "div" || tag == "section" || tag == "caption") { flush(); next }
      next
    }
    {
      if (skip) next
      gsub(/[ \t\r]+/, " ")
      if ($0 == "") next
      if ($0 == " ") { if (buf != "" && buf !~ / $/) buf = buf " "; next }
      buf = buf $0
    }
    END { flush() }
  ' images="$2" | sed -e 's/&nbsp;/ /g; s/&amp;/\&/g; s/&lt;/</g; s/&gt;/>/g; s/&quot;/"/g; s/&#39;/'"'"'/g; s/&rsquo;/’/g; s/&lsquo;/‘/g; s/&rdquo;/”/g; s/&ldquo;/“/g; s/&mdash;/—/g; s/&ndash;/–/g; s/&hellip;/…/g; s/&#8217;/’/g; s/&#8216;/‘/g; s/&#8220;/“/g; s/&#8221;/”/g; s/&#8212;/—/g; s/&#8211;/–/g; s/&times;/×/g' | cat -s
}

work="$(mktemp -d -t reference)"
trap 'rm -rf "$work"; [ "$driver" = playwright ] && pw close >/dev/null; true' EXIT

page "$listing" "$work/listing.html"
slugs="$(grep -oE "href=\"/$path/[0-9]+-[a-z0-9-]+\"" "$work/listing.html" | sed -E "s#href=\"/$path/##; s/\"$//" | sort -u)"
[ -n "$slugs" ] || { echo "no $kind found at $listing"; exit 1; }
echo "$(wc -l <<<"$slugs" | tr -d ' ') $kind listed"

for slug in $slugs; do
  dir="$root/$slug"
  if [ -d "$dir" ] && [ "$refresh" = 0 ]; then echo "skip $slug: on disk"; continue; fi
  page "$site/$path/$slug" "$work/$slug.html" || continue
  grep -q 'static-container-details' "$work/$slug.html" || { echo "skip $slug: not a $one page"; continue; }
  mkdir -p "$dir"
  : > "$work/$slug.images"
  markdown "$work/$slug.html" "$work/$slug.images" > "$dir/$slug.md"
  n=0
  while read -r url; do
    [ -n "$url" ] || continue
    name="$(basename "${url%%\?*}")"
    [ -f "$dir/$name" ] && [ -s "$dir/$name" ] && continue
    image "$url" "$dir/$name" && n=$((n + 1))
  done < <(sort -u "$work/$slug.images")
  echo "$slug: $(wc -l <"$dir/$slug.md" | tr -d ' ') lines, $n images"
  sleep 1
done
