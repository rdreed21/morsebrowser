import * as zip from 'zip-a-folder'
import path from 'path'
import fs from 'fs'

class TestMe {
  static async main () {
    function ensureDirSync (dirpath: string) {
      try {
        return fs.mkdirSync(dirpath)
      } catch (err: any) {
        if (err.code !== 'EEXIST') throw err
      }
    }
    const zipFileName = 'morse.zip'
    const zipFromFolder = path.resolve(__dirname, 'dist')
    const endDownLoadFolder = path.join(zipFromFolder, 'download')
    const endDownLoadFile = path.join(endDownLoadFolder, zipFileName)
    const initialZipFile = path.resolve(__dirname, zipFileName)

    // zip has circular problem so we do it in stages
    // delete old directorty
    if (fs.existsSync(endDownLoadFolder)) {
      fs.rmSync(endDownLoadFolder, { recursive: true, force: true })
    }
    // console.log('removed')
    await zip.zip(zipFromFolder, initialZipFile)
    ensureDirSync(endDownLoadFolder)
    fs.renameSync(initialZipFile, endDownLoadFile)
  }
}

TestMe.main()
