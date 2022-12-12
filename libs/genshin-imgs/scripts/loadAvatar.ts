import path from 'path'
import fs from 'fs'
import AvatarExcelConfigData from '../GenshinData/ExcelBinOutput/AvatarExcelConfigData.json'
export default function loadAvatar() {
    const projectDir = path.resolve(__dirname, "..")
    const texture2dDir = path.join(projectDir, "texture2D")
    if (!fs.existsSync(texture2dDir)) {
        console.error("Texture2D directory not found.")
        process.exit(1)
    }

    type AvatarExcelConfigDataEntry = {
        id: number,
        iconName: string
    }
    const avatarIconMap = (AvatarExcelConfigData as AvatarExcelConfigDataEntry[])
        .map(({ id, iconName }) => [id, iconName])
        .filter(([id, icon]) => {
            const namecardPath = path.join(texture2dDir, `${icon}.png`)
            const exists = fs.existsSync(namecardPath)
            if (!exists) {
                console.log(`avatar ${id}:${icon} does not exist in texture2D`)
                return false
            }

            const destPath = path.join(projectDir, "src", "avatars", `${id}.png`)
            fs.copyFile(namecardPath, destPath, (err) => {
                if (err) throw err
            })
            return true
        }) as Array<[id: number, icon: string]>;

    const indexStr = `${avatarIconMap.map(([id]) => `import img_${id} from './${id}.png';`).join("\n")}
    const avatars = {
    ${avatarIconMap.map(([id]) => `  ${id}:img_${id},`).join("\n")}
    }
    export default avatars;
    `;
    fs.writeFileSync(path.join(projectDir, "src", "avatars", "index.ts"), indexStr);
}



