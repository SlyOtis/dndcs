#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")/.."

base="http://localhost:5173"
email="$(sed -n 's/^WALK_EMAIL=//p' .env)"
password="$(sed -n 's/^WALK_PASSWORD=//p' .env)"
[ -n "$email" ] && [ -n "$password" ] || { echo "WALK_EMAIL and WALK_PASSWORD are empty in .env"; exit 1; }
curl -sf -o /dev/null "$base/" || { echo "nothing answers at $base: run just dev first"; exit 1; }

failures=()
page=""

pw() { playwright-cli -s=walk --raw "$@" 2>/dev/null; }
js() { pw eval "$1" | jq -r .; }
fail() { failures+=("$page: $1"); echo "FAIL $page: $1"; }

wait_for() {
  local tries=0
  until [ "$(js "$1")" = "true" ]; do
    tries=$((tries + 1))
    [ "$tries" -ge 60 ] && { fail "timed out waiting for $2"; return 1; }
    sleep 0.5
  done
}

search_open() { js "document.querySelector('#search-command') !== null"; }

expect_search() {
  local want="$1" after="$2" tries=0
  until [ "$(search_open)" = "$want" ]; do
    tries=$((tries + 1))
    [ "$tries" -ge 10 ] && { fail "search dialog open=$(search_open) after $after, wanted $want"; return 1; }
    sleep 0.2
  done
}

check_page() {
  local bar="$1" summary errors warnings w over
  summary="$(pw console | head -1)"
  errors="$(sed -E 's/.*Errors: ([0-9]+).*/\1/' <<<"$summary")"
  warnings="$(sed -E 's/.*Warnings: ([0-9]+).*/\1/' <<<"$summary")"
  if [ "${errors:-0}" != "0" ] || [ "${warnings:-0}" != "0" ]; then
    fail "console carries $errors errors and $warnings warnings"
    pw console warning | sed -n '/^\[/p' | sed 's/^/    /'
  fi
  for w in 1280 1600 2000; do
    pw resize "$w" 900 >/dev/null
    over="$(js "Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth")"
    [ "$over" -gt 0 ] && fail "document is ${over}px wider than the viewport at $w"
  done
  pw resize 1600 900 >/dev/null
  pw press Meta+k >/dev/null; expect_search true "Cmd K"
  pw press Meta+k >/dev/null; expect_search false "a second Cmd K"
  pw press Meta+k >/dev/null; expect_search true "Cmd K"
  pw press Escape >/dev/null; expect_search false "Escape"
  [ "$bar" = "bar" ] || return 0
  local box
  box="$(js "JSON.stringify((() => { const r = document.querySelector(\"button[title^='Search ']\").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })())")"
  pw run-code "async page => { await page.mouse.click($(jq '.[0]' <<<"$box"), $(jq '.[1]' <<<"$box")) }" >/dev/null
  expect_search true "the bar search button"
  pw run-code "async page => { await page.mouse.click($(jq '.[0]' <<<"$box"), $(jq '.[1]' <<<"$box")) }" >/dev/null
  expect_search false "a second press of the bar search button"
}

visit() {
  page="$1"
  pw goto "$base$1" >/dev/null
  wait_for "$2" "$3" || return 1
  local at
  at="$(js "location.pathname")"
  [ "$at" = "$1" ] || { fail "landed on $at"; return 1; }
}

first_href() { js "document.querySelector('$1')?.getAttribute('href') ?? ''"; }

trap 'pw close >/dev/null' EXIT
pw open "$base/login" >/dev/null

visit /login "document.querySelector('#login-email') !== null" "the sign in form" && check_page gate
visit /signup "document.querySelector('#signup-email') !== null" "the sign up form" && check_page gate

page="sign in"
pw goto "$base/login" >/dev/null
wait_for "document.querySelector('#login-email') !== null" "the sign in form"
pw fill "#login-email" "$email" >/dev/null
pw fill "#login-password" "$password" >/dev/null
pw click "getByRole('button', { name: 'Sign In' })" >/dev/null
wait_for "location.pathname === '/main' || document.querySelector('.gate-error') !== null" "the hearth after sign in"
[ "$(js "location.pathname")" = "/main" ] || { echo "sign in did not reach the hearth: $(js "document.querySelector('.gate-error')?.textContent.trim() ?? ''")"; exit 1; }

hearth="document.querySelector('.hall-hero-name') !== null && document.querySelector('.dnd-loading') === null"
visit /main "$hearth" "the hearth" && check_page bar

page="/main"
wait_for "[...document.querySelectorAll('.dnd-card-title')].some((e) => e.textContent.trim() === 'Testy')" "Testy on the hearth"
js "[...document.querySelectorAll('.dnd-card')].find((e) => e.querySelector('.dnd-card-title').textContent.trim() === 'Testy').click()" >/dev/null
wait_for "location.pathname.startsWith('/character/')" "the character sheet"
sheet="$(js "location.pathname")"
campaign_card="document.querySelector('section[aria-label=\"Campaigns\"] .dnd-card')"

if visit "$sheet" "document.querySelector('.sheet-name')?.textContent.trim() === 'Testy'" "Testy's sheet"; then
  check_page bar
  crown_pickers="$(js "document.querySelector('.sheet-crown').querySelectorAll('select, .trace, [aria-pressed]').length")"
  [ "$crown_pickers" = "0" ] || fail "the crown carries $crown_pickers frame picker controls"
  crown_names="$(js "/\b(Lancet|Ogee|Trefoil|Shield|Round)\b/.test(document.querySelector('.sheet-crown').textContent)")"
  [ "$crown_names" = "false" ] || fail "the crown names a frame"
  pw click "getByTitle('Choose the portrait frame')" >/dev/null
  wait_for "document.querySelector('#dialog-title')?.textContent.trim() === 'Choose Your Frame'" "the frame dialog after clicking the portrait"
  pw press Escape >/dev/null
  wait_for "document.querySelector('#dialog-title') === null" "the frame dialog to close"
fi

visit /main "$hearth" "the hearth"
if [ "$(js "$campaign_card !== null")" = "true" ]; then
  js "$campaign_card.click()" >/dev/null
  wait_for "location.pathname.startsWith('/campaign/')" "a campaign"
  visit "$(js "location.pathname")" "document.querySelector('.dnd-shell-mark') !== null && document.querySelector('.dnd-loading') === null" "the campaign" && check_page bar
else
  fail "no campaign on the hearth"
fi

if visit /main/create/character "document.querySelector('#character-name') !== null" "the character form"; then
  check_page bar
  pw fill "#character-name" "Walk" >/dev/null
  pw click "getByRole('button', { name: 'Continue' })" >/dev/null
  wait_for "location.pathname === '/main/create/character/class'" "the class page"
fi

catalog="document.querySelector('.dnd-catalog-more') !== null"
if visit /main/create/character/class "$catalog" "the class catalog"; then
  check_page bar
  visit "$(first_href '.dnd-catalog-more')" "document.querySelector('.source-crown') !== null" "the class detail" && check_page bar
  visit /main/create/character/class "$catalog" "the class catalog"
  pw click "locator('.dnd-catalog-row').first()" >/dev/null
  pw click "getByRole('button', { name: /^Continue as/ })" >/dev/null
  wait_for "location.pathname === '/main/create/character/race'" "the race page"
fi

if visit /main/create/character/race "$catalog" "the race catalog"; then
  check_page bar
  visit "$(first_href '.dnd-catalog-more')" "document.querySelector('.source-crown') !== null" "the race detail" && check_page bar
fi

visit /user "document.querySelector('.dnd-shell-mark')?.textContent.trim() === 'Profile'" "the profile" && check_page bar

if [ "${#failures[@]}" -gt 0 ]; then
  printf '\n%d failed\n' "${#failures[@]}"
  printf '  %s\n' "${failures[@]}"
  exit 1
fi
echo "the walk is clean"
