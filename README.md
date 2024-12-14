# Upload to Factorio Mod Portal action

This action upload your mod archive to the specified Factorio Mod Portal Page.
It will not create a new mod page for you, you have to do that yourself.

## Inputs

### `info-path`

**Optional** Path to your info.json. Default `src/info.json`.

### `mod-dir`

**Optional** Path of the directory containing your mod archive (.zip). Default
`Dist`.

## Enviroment Variables

### `FACTORIO_API_TOKEN`

**Required** Your Factorio
[Mod Upload API](https://wiki.factorio.com/Mod_upload_API) token.

## Example usage

```yaml
uses:
  - name: Upload to Mod Portal
    uses: lisekilis/Factorio-mod-portal-Upload
      env:
        FACTORIO_API_TOKEN: ${{ secrets.FACTORIO_TOKEN }}
```
