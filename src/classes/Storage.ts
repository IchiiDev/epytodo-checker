/*
** EPITECH PROJECT, 2024
** epytodo-checker
** File description:
** Storage
*/

export default class Storage {

    private map: Map<string, string> = new Map();

    constructor() {}

    public set(key: string, value: string): void {
        this.map.set(key, value);
    }

    public get(key: string): string | undefined {
        return this.map.get(key);
    }

    public delete(key: string): void {
        this.map.delete(key);
    }

    public clear(): void {
        this.map.clear();
    }

    public has(key: string): boolean {
        return this.map.has(key);
    }

    public get size(): number {
        return this.map.size;
    }

    public get keys(): string[] {
        return Array.from(this.map.keys());
    }

    // public format(str: string): string {
    //     return str.replace(/(\$\{[a-zA-Z0-9]+\})/g, (match) => {
    //         const key = match.substring(2, match.length - 1);
    //         return this.get(key);
    //     });
    // }

};
