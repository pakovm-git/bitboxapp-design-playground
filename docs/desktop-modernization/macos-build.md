# Playground macOS build handoff

The layout editor and Calm Cards reference screens are on
[`codex/playground-layout-editor` in the playground fork](https://github.com/pakovm-git/bitboxapp-design-playground/tree/codex/playground-layout-editor).
This is an experimental testing build. macOS compilation and runtime have not
been verified for these changes.

## Get the source

```sh
git clone --recurse-submodules --branch codex/playground-layout-editor \
  https://github.com/pakovm-git/bitboxapp-design-playground.git
cd bitboxapp-design-playground
git rev-parse HEAD
```

Keep the printed commit ID with any build results. For an existing checkout,
switch to the fork branch and run `git submodule update --init --recursive`.

## Build on a Mac

Use the repository's [macOS setup instructions](../BUILD.md#macos). The required
versions are Go 1.26, Node.js 24.x with npm 11.x, and Qt 6.8.2 with WebEngine,
WebChannel and Positioning. Xcode command-line tools and CMake must also be
available. The Qt installation needs its private GUI headers for QWindowKit;
the repository builds the vendored QWindowKit and SingleApplication sources.

Make sure the selected Qt kit supplies `qmake`, `rcc` and `macdeployqt`. For the
Qt installation path used in the setup guide:

```sh
export PATH="$HOME/Qt/6.8.2/macos/bin:$HOME/Qt/6.8.2/macos/libexec:$PATH"
qmake -query QT_VERSION
make qt-osx
```

Run from the repository root. This target installs and builds the web frontend,
builds the Go backend and native shell, bundles Qt, and runs the macOS security
check. The resulting application is `frontends/qt/build/osx/BitBox.app`.
Signing and notarization are separate steps documented in the setup guide.

## Try the playground

Close any running BitBoxApp first; the testing app shares its single-instance
identifier with the regular app. Launch in testnet mode:

```sh
./frontends/qt/build/osx/BitBox.app/Contents/MacOS/BitBox -testnet
```

Open **Settings → Playground → Screen previews and component kit**. Try
**Reference design → Calm cards**, **Use Calm cards design**, and **Open layout
editor**. Check both themes, narrow/wide layouts, section ordering and undo.
Reference screens use sample data and inactive wallet actions.

The frontend suite, lint/type checking, browser fixture and Linux packaging passed
before handoff. Please record the Mac architecture, macOS version and commit ID
alongside any build errors or native UI issues.
