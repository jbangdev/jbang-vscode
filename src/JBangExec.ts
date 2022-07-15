function isWin():boolean {
    return /^win/.test(process.platform);
}

export function jbang():string {
    return isWin()?"jbang.cmd":"jbang";
}