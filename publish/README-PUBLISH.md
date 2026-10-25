# Publishing these changes to GitHub

This sandbox has no GitHub remote or credentials, so push from your own machine.

## Option A - apply the patch files (recommended)
The two commits are exported as standard git patches:
  0001-Add-flight-and-shipping-transmission-layer-with-auto.patch
  0002-Add-African-countries-Kenya-Mozambique-Madagascar-et.patch

On a clone of your repo (soyuz43/...):
    git checkout main
    git checkout -b feature/africa-travel-corridors
    git am publish/0001-*.patch publish/0002-*.patch
    git push -u origin feature/africa-travel-corridors
    gh pr create --title "Add African countries + Chicago-Johannesburg-Maputo-Antananarivo corridors" --body ""

## Option B - fetch the branch directly
If this workspace's repo is ever exposed via `git daemon` or an http server:
    git remote add sandbox <url>
    git fetch sandbox
    git push origin sandbox/qwen-code-eeeb65e3...:feature/africa-travel-corridors

## What the commits contain
1) Flight & shipping transmission layer with automatic airport/seaport closures
2) 12 new African countries + named routes:
   Chicago -> Johannesburg (air, 420)
   Johannesburg -> Maputo (air, 180)
   Maputo -> Antananarivo (air, 120), Maputo -> Toamasina (sea, 160)
   Nairobi -> Johannesburg (air, 230)
