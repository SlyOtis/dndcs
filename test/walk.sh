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
js() {
  local out
  if ! out="$(pw eval "$1")"; then
    echo "playwright-cli: $out" >&2
    kill -s TERM $$
  fi
  jq -r . <<<"$out"
}
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
  for w in 360 640 900 1280 1600 2000; do
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

hearth="document.querySelector('.hall-hero-name') !== null && document.querySelector('.dnd-loading') === null"
page="sign in"
pw goto "$base/login" >/dev/null
wait_for "document.querySelector('#login-email') !== null" "the sign in form"
pw fill "#login-email" "$email" >/dev/null
pw fill "#login-password" "$password" >/dev/null
pw click "getByRole('button', { name: 'Sign In' })" >/dev/null
wait_for "($hearth) || document.querySelector('.gate-error') !== null" "the hearth after sign in"
[ "$(js "$hearth")" = "true" ] || { echo "sign in did not reach the hearth: $(js "document.querySelector('.gate-error')?.textContent.trim() ?? ''")"; exit 1; }

visit /main "$hearth" "the hearth" && check_page bar

page="encounter tracker"
campaign_id="$(js "(async () => { const { userCampaigns } = await import('/src/lib/stores/campaign.store.ts'); let held = []; userCampaigns.subscribe((entries) => (held = entries))(); return held[0]?.id ?? '' })()")"
if [ -z "$campaign_id" ]; then
  fail "no campaign to track an encounter in"
else
  tracker="[...document.querySelectorAll('.dnd-menu-section')].find((e) => /Encounter tracker/.test(e.textContent))"
  rows="[...$tracker.querySelectorAll('.dnd-menu-row')]"
  pw click "getByTitle('Toggle the menu')" >/dev/null
  wait_for "$tracker !== undefined" "the navigator drawer"
  js "$tracker.querySelector('.dnd-menu-band').click() ?? null" >/dev/null
  wait_for "$tracker.classList.contains('dnd-menu-section-open')" "the tracker to open"
  [ "$(js "$tracker.textContent.includes('No encounter is under way.')")" = "true" ] || fail "the tracker carries no empty state while the campaign has no encounter"
  encounter_id="$(js "(async () => { const { campaignService } = await import('/src/lib/firestore.service.ts'); return campaignService.postEncounter('$campaign_id', { title: 'Walk Ambush', is_active: true, is_known: true, round: 3, turn: 1, combatants: [{ id: 'w1', name: 'Goblin Cutter', kind: 'npc', npc_id: 'w-n1', initiative: 8, hit_points: 5, max_hit_points: 12, conditions: ['prone'], is_hit_points_known: true }, { id: 'w2', name: 'Walk Hero', kind: 'character', character_id: 'w-c1', initiative: 17, hit_points: 22, max_hit_points: 30, conditions: [], is_hit_points_known: true }, { id: 'w3', name: 'Dire Wolf', kind: 'npc', npc_id: 'w-n2', initiative: 12, hit_points: 9, max_hit_points: 26, conditions: [], is_hit_points_known: true }] }) })()")"
  if wait_for "$rows.length === 3" "the combatants to stream into the tracker"; then
    order="$(js "$rows.map((e) => e.querySelector('.dnd-menu-row-mark').textContent.trim()).join(',')")"
    [ "$order" = "17,12,8" ] || fail "the combatants stand in $order, not in initiative order 17,12,8"
    current="$(js "String($rows.findIndex((e) => e.getAttribute('aria-current') === 'true'))")"
    [ "$current" = "1" ] || fail "turn 1 of the round points at row $current, not at the second in initiative order"
    [ "$(js "$tracker.textContent.includes('Walk Ambush')")" = "true" ] || fail "the tracker does not name the encounter it lists"
    [ "$(js "$tracker.querySelector('.dnd-menu-empty') === null")" = "true" ] || fail "the tracker keeps an empty state while an encounter is under way"
  fi
  js "(async () => { const { campaignService } = await import('/src/lib/firestore.service.ts'); await campaignService.deleteEncounter('$campaign_id', '$encounter_id'); return true })()" >/dev/null
  wait_for "$tracker.textContent.includes('No encounter is under way.')" "the empty state after the encounter is struck"
  pw click "getByTitle('Toggle the menu')" >/dev/null
fi

page="/main"
wait_for "[...document.querySelectorAll('.dnd-card-title')].some((e) => e.textContent.trim() === 'Testy')" "Testy on the hearth"
js "[...document.querySelectorAll('.dnd-card')].find((e) => e.querySelector('.dnd-card-title').textContent.trim() === 'Testy').click() ?? null" >/dev/null
wait_for "location.pathname.startsWith('/character/')" "the character sheet"
sheet="$(js "location.pathname")"
campaign_card="document.querySelector('section[aria-label=\"Campaigns\"] .dnd-card')"

if visit "$sheet" "document.querySelector('.sheet-name')?.textContent.trim() === 'Testy'" "Testy's sheet"; then
  check_page bar
  crown_pickers="$(js "document.querySelector('.sheet-crown').querySelectorAll('select, .trace, [aria-pressed]').length")"
  [ "$crown_pickers" = "0" ] || fail "the crown carries $crown_pickers frame picker controls"
  crown_names="$(js "/\b(Lancet|Ogee|Trefoil|Shield|Round)\b/.test(document.querySelector('.sheet-crown').textContent)")"
  [ "$crown_names" = "false" ] || fail "the crown names a frame"
  boxes="$(js "document.querySelectorAll('.sheet-stats > *').length")"
  [ "$boxes" = "7" ] || fail "the stat board carries $boxes boxes"
  for w in 1280 1600 2000; do
    pw resize "$w" 900 >/dev/null
    spill="$(js "[...document.querySelectorAll('.sheet-stats *')].filter((e) => e.children.length === 0 && e.textContent.trim() && (() => { const b = e.closest('.sheet-stats > *').getBoundingClientRect(), r = e.getBoundingClientRect(); return r.left < b.left - 1 || r.right > b.right + 1 })()).map((e) => e.textContent.trim()).join(', ')")"
    [ -z "$spill" ] || fail "the stat titles run outside their boxes at $w: $spill"
    short="$(js "String(Math.round(document.querySelector('.sheet-board').getBoundingClientRect().right - document.querySelector('.sheet-tabs').getBoundingClientRect().right))")"
    [ "$short" = "0" ] || fail "the tabs panel stops ${short}px short of the board's right edge at $w"
  done
  pw resize 1600 900 >/dev/null
  pw click "getByTitle('Choose the portrait frame')" >/dev/null
  wait_for "document.querySelector('#dialog-title')?.textContent.trim() === 'Choose Your Frame'" "the frame dialog after clicking the portrait"
  crown_clip="document.querySelector('.sheet-crown .dnd-portrait-glass').getAttribute('style')"
  taken="$(js "document.querySelector('.trace-lit .trace-name').textContent.trim()")"
  worn="$(js "$crown_clip")"
  js "[...document.querySelectorAll('.trace')].find((e) => !e.classList.contains('trace-lit')).click() ?? null" >/dev/null
  [ "$(js "$crown_clip")" = "$worn" ] && fail "the crown keeps $worn after another frame is chosen"
  [ "$(js "document.querySelector('.trace-lit .trace-name').textContent.trim()")" = "$taken" ] && fail "the dialog still lights $taken after another frame is chosen"
  js "[...document.querySelectorAll('.trace')].find((e) => e.querySelector('.trace-name').textContent.trim() === '$taken').click() ?? null" >/dev/null
  [ "$(js "$crown_clip")" = "$worn" ] || fail "the crown does not return to $worn when $taken is chosen back"
  pw press Escape >/dev/null
  wait_for "document.querySelector('#dialog-title') === null" "the frame dialog to close"

  pw click "getByTitle('Import sources')" >/dev/null
  wait_for "document.querySelector('#dialog-title')?.textContent.trim() === 'Character Sources'" "the sources dialog after clicking the bar"
  dialog="document.querySelector('[role=dialog]')"
  raw="$(js "[...$dialog.querySelectorAll('button')].filter((e) => !/dnd-/.test(e.className)).length")"
  [ "$raw" = "0" ] || fail "the sources dialog carries $raw raw buttons"
  emoji="$(js "/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test($dialog.textContent)")"
  [ "$emoji" = "false" ] || fail "the sources dialog carries an emoji"
  painted="$(js "[...$dialog.querySelectorAll('*')].filter((e) => /#[0-9a-f]{3}|rgb/i.test(e.getAttribute('style') ?? '')).length")"
  [ "$painted" = "0" ] || fail "the sources dialog paints $painted elements with a literal colour"
  pw click "getByRole('button', { name: 'Import New Source' })" >/dev/null
  wait_for "document.querySelector('#dialog-title')?.textContent.trim() === 'Import Character Source'" "the import dialog"
  [ "$(js "document.querySelector('#source-file') !== null")" = "true" ] || fail "the import dialog carries no file field"
  pw press Escape >/dev/null
  wait_for "document.querySelector('#dialog-title')?.textContent.trim() === 'Character Sources'" "the sources dialog after Escape on the import dialog"
  pw press Escape >/dev/null
  wait_for "document.querySelector('#dialog-title') === null" "the sources dialog to close"
fi

visit /main "$hearth" "the hearth"
if [ "$(js "$campaign_card !== null")" = "true" ]; then
  js "$campaign_card.click() ?? null" >/dev/null
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
  strays="$(js "(async () => { const { classes } = await (await fetch('/sources/classes/index.json')).json(); const held = new Set(classes); return [...document.querySelectorAll('.dnd-catalog-row .dnd-catalog-name')].map((e) => e.textContent.trim()).filter((name) => held.has(name.toLowerCase().replace(/ /g, '-'))).join(', ') })()")"
  [ -z "$strays" ] || fail "the race catalog offers a class as a race: $strays"
  visit "$(first_href '.dnd-catalog-more')" "document.querySelector('.source-crown') !== null" "the race detail" && check_page bar
fi

visit /main/create/campaign "document.querySelector('#campaign-prompt') !== null" "the campaign form" && check_page bar

visit /user "document.querySelector('.dnd-shell-mark')?.textContent.trim() === 'Profile'" "the profile" && check_page bar

if [ "${#failures[@]}" -gt 0 ]; then
  printf '\n%d failed\n' "${#failures[@]}"
  printf '  %s\n' "${failures[@]}"
  exit 1
fi
echo "the walk is clean"
