# Installation and setup

## Install from a VSIX

Download a release `.vsix`, or package the repository locally:

```powershell
npx.cmd vsce package --allow-star-activation
code.cmd --install-extension .\hoi4modernutils-<version>.vsix --force
```

You can also use **Extensions: Install from VSIX...** in Visual Studio Code.

**[PLACEHOLDER: Add the official release asset link and supported VS Code version range.]**

## First-time configuration

1. Open VS Code and enable HOI4 Modern Utils.
2. Set `hoi4ModernUtils.installPath` to the Hearts of Iron IV installation directory, or run **HOI4 Modern Utils: Select HOI4 install path** from the Command Palette.
3. Open the root folder of your mod as the VS Code workspace.
4. Optionally run **HOI4 Modern Utils: Select mod file** and choose the active `.mod` descriptor.
5. Run **Preview World Map** from the Command Palette.

If the workspace contains exactly one suitable `.mod` descriptor, it can be selected automatically. If it contains several, select one explicitly so `replace_path` behavior is unambiguous.

## Required source data

World-map features depend on a readable HOI4 installation and an open mod workspace. Map-editing workflows expect the normal map files, such as `provinces.bmp`, `definition.csv`, state files, strategic regions, and related map data, to be available through the base game and active mod resolution.

**[PLACEHOLDER: Document the exact HOI4 versions and DLC combinations verified for the current release.]**

## Useful commands

| Command | Use |
| --- | --- |
| **Preview World Map** | Opens the data-aware world-map preview. |
| **Preview HOI4 file** | Opens a supported text-file preview. |
| **Select HOI4 install path** | Chooses the game installation folder. |
| **Select mod file** | Chooses the active mod descriptor. |
| **Scan References** | Runs the extension's reference scan. |

## Updating the extension

Install a newer VSIX with the same command and reload VS Code when prompted. Confirm the installed version in the Extensions view before trusting new map-editing behavior.

**[PLACEHOLDER: Add upgrade notes if settings or map file formats change between releases.]**
