import path from 'path'
import fs from 'fs'
import MaterialExcelConfigData from '../GenshinData/ExcelBinOutput/MaterialExcelConfigData.json'
export default function loadNameCard() {
    const projectDir = path.resolve(__dirname, "..")
    const texture2dDir = path.join(projectDir, "texture2D")
    if (!fs.existsSync(texture2dDir)) {
        console.error("Texture2D directory not found.")
        process.exit(1)
    }

    type MaterialEntry = {
        materialType: string,
        id: number,
        icon: string
        picPath: [alpha: string, p: string]
    }
    const namecardIconMap = (MaterialExcelConfigData as MaterialEntry[])
        .filter(({ materialType }) => materialType === "MATERIAL_NAMECARD")
        .map(({ id, picPath: [icon, card] }) => [id, icon])
        .filter(([id, icon]) => {
            const namecardPath = path.join(texture2dDir, `${icon}.png`)
            const exists = fs.existsSync(namecardPath)
            if (!exists) {
                console.log(`namecard ${id}:${icon} does not exist in texture2D`)
                return false
            }

            const destPath = path.join(projectDir, "src", "namebanners", `${id}.png`)
            fs.copyFile(namecardPath, destPath, (err) => {
                if (err) throw err
            })
            return true
        }) as Array<[id: number, icon: string]>;

    const indexStr = `${namecardIconMap.map(([id]) => `import img_${id} from './${id}.png';`).join("\n")}
    const namebanners = {
    ${namecardIconMap.map(([id]) => `  ${id}:img_${id},`).join("\n")}
    }
    export default namebanners;
    `;
    fs.writeFileSync(path.join(projectDir, "src", "namebanners", "index.ts"), indexStr);
}



