export class StringWriter {
    private buffer: Array<string>;

    public constructor () {
        this.buffer = [];
    }

    public write (text: string): void {
        this.buffer.push(text)
    }

    public append (text: string): void {
        this.buffer.push(text);
    }

    public prepend (text: string): void {
        this.buffer.unshift(text);
    }

    public toString (): string {
        return this.buffer.join("")
    }

    public flush (): void {
        this.buffer = [];
    }
}