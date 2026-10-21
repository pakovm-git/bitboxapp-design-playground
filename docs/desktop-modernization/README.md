# Desktop modernization comparisons

These generated figures explain the supporting UI work around desktop CSD.
CSD is enabled in both columns: the left reconstructs missing supporting
changes, and the right illustrates the intended integrated result. They are
explanatory mockups, not runtime screenshots or test evidence. macOS native
compilation and behavior remain unvalidated.

| Figure | Shared motivation |
|---|---|
| [Headers and sidebar](images/01-headers-sidebar.png) | Control insets, alignment, preserved logo size and sidebar width. |
| [Guide and overlays](images/02-guide-overlay.png) | Separate close controls, fixed guide header, drag exclusions and dismissal. |
| [Scrollbars](images/03-scrollbars.png) | Stable gutters, inset thumbs, idle appearance and corner clearance. |
| [Linux window rendering](images/04-linux-window-finish.png) | Rounded surfaces, startup transparency, theme-aware outline and resize targets. |
| [Appearance and settings](images/05-appearance-settings.png) | Linux portal appearance and explicit restart feedback for system borders. |

The figures relate to the Linux, Windows and macOS CSD implementations; their
captions identify platform-specific behavior. Custom thumb styling applies to
Linux/Windows; macOS keeps native scrollbar appearance. The portal correction
and the illustrated 4px-inside/6px-outside resize targets apply to Linux.

Static figures do not verify native dragging, Snap Layouts, animation timing,
startup rendering or live resizing. Use native runtime captures and recordings
for those checks. Raw user screenshots and recordings are intentionally not
included here because some contain other desktop content.

The current playground is available on `bitboxapp-design-playground`.
`desktop-modernization-effort` remains as the earlier upstream proposal branch.
The CSD-only comparison branch preserves upstream UI layout and styling so
engineers can observe which integration gaps the shared changes address.

## Local appearance playground

Open **Settings → Playground** on `bitboxapp-design-playground`. Colors, gradients,
button/input/card shapes, borders, card/button shadows, separators, scrollbar
appearance and motion update live. Shapes and layout options are shared between
themes; light and dark palettes remain separate. Reset controls and JSON preset
import/export support comparing and sharing designs. Header height and logo
visibility use Qt settings; the remaining design profiles use WebEngine storage.

**Use system window borders** requires a restart and disables custom window
behavior while retaining the in-app design and appearance controls. Window-button
previews are available across desktop platforms; native macOS switching is still
unverified. The web appearance controls add no new styling dependency; the CSD
implementation uses vendored QWindowKit. Custom palettes may reduce contrast.
Reduced-motion and forced-color system preferences take precedence over custom
animation and scrollbar styling.

See the [fork README](../../README.md) for experimental scope, downloads, startup
and shared-data behavior, and the limits of the available validation.

## Structured layout editor

In **Settings → Playground**, open **Screen previews and component kit**, then
**Open layout editor**. The panel stays available when navigating the desktop app.
Choose a section group, drag its sections or use the up/down buttons, and select
one or two columns for Portfolio and account screens. Each section can occupy
the left column, right column, or full width. Below 1080px of available content
width, columns stack in the saved reading order.

**Select an element** picks a named part without activating the control beneath
it; Escape cancels selection. Element controls cover typography, spacing, icon
sizes, borders, colors, alignment and inline/stacked arrangements. A change to
a repeated part, such as transaction rows, applies to all matching parts on the
supported screens. Global typography, content spacing, row density and button
size controls remain alongside the existing appearance settings.

Row groups can also reorder transaction icons, notes/status, amounts and the
details button. Balance values can put the crypto or fiat amount first.

The supported surfaces are the sidebar, Portfolio, account overview/actions,
account activity, transaction details, and the component kit. The editor retains
the current app design as its starting point. **Use Calm cards design** applies
the colleague's card surfaces, column layout and stacked account balance as a
starting point. Other screens retain their existing flows. Ordinary browser and
mobile sessions do not apply these desktop layout profiles.

Previews contain sample data and inactive wallet actions. Their chart is an
illustration, while balances, transaction rows, transaction headers, badges and
form controls use the app's components. Loading, empty, error, hidden-amount,
pending and failed examples can be selected without a device.

**Reference design → Calm cards** uses components copied from
[the colleague's source at f0bbec3ba](https://github.com/shonsirsha/bitbox-wallet-app/tree/f0bbec3ba/frontends/web/src/prototype).
The imported kit lives in `components/desktop-design/calm-cards/kit`; the reference
compositions expose the same named parts as the live app. These samples have fixed
display values and an illustrative chart. No prototype backend, request interception,
router replacement, or frontend wallet calculations are installed. The live Portfolio
activity feed reads existing account APIs, refreshes on transaction notifications,
reports load failures and opens the selected account. Real account actions retain
their existing availability and device connection checks. Swap and Info action
examples belong to the reference screens only.

The live wallet adapts the concept to the existing components and desktop frame;
it does not replace the app with the colleague's throwaway prototype. Full reset
restores the original starting design. Applying the template is also reversible
through editor undo. Editor layout changes are covered by undo; global appearance
changes continue to use their existing reset controls.

Layout and geometry are shared across themes; element colors remain separate
for light and dark appearances. Undo/redo covers the last 30 editor changes in
the current session. Element reset clears its overrides in both themes; palette
reset clears the current theme's colors; full reset also clears editor layouts.
Profiles persist in WebEngine storage under `bitbox.desktop-design`, independently
of wallet settings and native chrome preferences.

Export now writes version 2 of `bitbox-design`, containing the appearance
`profiles` and editor `design`. Version 1 imports still work and clear editor
overrides. Older builds cannot import version 2. Export contains design settings
only. Inputs are restricted to registered part IDs, known layout placements and
bounded style fields; presets cannot inject arbitrary CSS or remove controls.

The registry is in `frontends/web/src/utils/desktop-design.ts`. Layouts use
explicit keyed React items so moving a section preserves its state and updates
DOM order. Add parts to this registry and the English labels, then attach their
attributes inside a design scope. The editor is mounted separately from the
native chrome controller so those modules do not depend on one another.

Validation passed: 731 frontend tests in 108 files, frontend lint/type checking,
and browser checks with the native bridge mocked at wide and narrow widths.
Linux x86_64 AppImage, Debian and RPM testing packages were built with the project
helper and their checksums verified. The packaged app was not launched; native
window behavior and hardware interaction still require testing. macOS compilation
and runtime remain unverified; see the [macOS build handoff](macos-build.md).
