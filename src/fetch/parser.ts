interface coreVersion {
    name: string,
    displayName: string,
    versionsMethod: string,
    urlGetMethod: string
}
interface SelectOption {
    value: string | number;
    label: string;
    img?: string;
    image?: string;
    html?: string;
    state?: string;
}
function parseCoreversions(data: Record<string, coreVersion>): SelectOption[] {
    const mapValues = Object.values(data).map(item => ({
        value: item.versionsMethod || item.urlGetMethod,
        label: item.displayName || item.name,
    }));

    return mapValues;
}
export {
    parseCoreversions
}