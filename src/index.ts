import * as core from '@actions/core'
import fs, { PathLike } from 'fs'
import path from 'path'
import fetch from 'node-fetch-commonjs'

interface InitResponse {
  upload_url?: URL
  error?: string
  message?: string
}
interface Info {
  name: string
}

export async function run(): Promise<void> {
  try {
    const factorioAPIToken = process.env.FACTORIO_API_TOKEN
    if (!factorioAPIToken) {
      throw new Error('No token provided, canceling upload')
    }

    const infoPath = core.getInput('info-path')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const modData: Info = JSON.parse(
      fs.readFileSync(infoPath ? infoPath : `src/info.json`, 'utf-8')
    )
    const modID: string = modData.name
    if (!modID) {
      throw new Error(
        `No mod ID found in ${infoPath ? infoPath : `src/info.json`}`
      )
    }

    const modDir = core.getInput('mod-dir')
    if (!fs.existsSync(modDir ? modDir : `dist`)) {
      throw new Error(
        `Mod directory: ${modDir ? modDir : `dist`} doesn't exist`
      )
    }

    const modDirContents = fs.readdirSync(modDir ? modDir : `dist`)
    let modPath: PathLike | undefined
    let zipCounter = 0
    let fileName
    modDirContents.forEach(file => {
      if (path.extname(file) === '.zip') {
        modPath = path.join(modDir ? modDir : `dist`, file)
        fileName = file
        zipCounter++
      }
    })

    if (!modPath) {
      throw new Error(`No mod archive found in ${modDir}`)
    }
    if (zipCounter > 1) {
      throw new Error(`Found multiple archives in ${modDir}`)
    }

    const initBody = new FormData()
    initBody.append('mod', modID)
    const uploadBody = new FormData()
    uploadBody.append(
      'file',
      new Blob([fs.readFileSync(modPath)], {
        type: 'application/x-zip-compressed'
      }),
      `${fileName}.zip`
    )

    // Initiate upload
    const initResponse = await fetch(
      `https://mods.factorio.com/api/v2/mods/releases/init_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${factorioAPIToken}`
        },
        body: initBody
      }
    )
    if (!initResponse.ok) {
      throw new Error(`Initial API request failed: ${initResponse.statusText}`)
    }

    const initData = (await initResponse.json()) as InitResponse
    if (initData.error) {
      throw new Error(
        `API returned error: ${initData.error} - ${initData.message}`
      )
    }

    if (!initData.upload_url) {
      throw new Error('No upload URL provided by the API')
    }

    // Upload mod file
    const uploadResponse = await fetch(initData.upload_url.toString(), {
      method: 'POST',
      body: uploadBody
    })

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload mod: ${uploadResponse.statusText}`)
    }

    core.setOutput('message', `Upload Successful`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
