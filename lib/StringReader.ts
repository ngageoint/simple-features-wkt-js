import { SFException } from "@ngageoint/simple-features-js";

export class StringReader {
    private text: string;
    private currentPosition: number;
    /**
     * Next token cache for peeks
     */
    private nextToken: string;

    /**
     * Next character number cache for between token caching
     */
    private nextCharacterNum: Number;

    public constructor (text: string) {
        this.text = text;
        this.currentPosition = 0;
    }

    private readCharacter (): string {
        let character = null;
        if (this.currentPosition <= this.text.length - 1) {
            character = this.text.slice(this.currentPosition, this.currentPosition + 1);
            this.currentPosition++;
        }
        return character;
    }

    public readToken(): string {

        let token = null;

        // Get the next token, cached or read
        if (this.nextToken != null) {
            token = this.nextToken;
            this.nextToken = null;
        } else {
            let builder = null;

            // Get the next character, cached or read
            let characterNum;
            if (this.nextCharacterNum != null) {
                characterNum = this.nextCharacterNum;
                this.nextCharacterNum = null;
            } else {
                characterNum = this.readCharacter();
            }

            // Continue while characters are left
            while (characterNum != null) {
                let character = characterNum;

                // Check if not the first character in the token
                if (builder != null) {

                    // Append token characters
                    if (StringReader.isTokenCharacter(character)) {
                        builder.push(character);
                    } else {
                        // Complete the token before this character and cache
                        // the character
                        if (!StringReader.isWhitespace(character)) {
                            this.nextCharacterNum = characterNum;
                        }
                        break;
                    }

                } else if (!StringReader.isWhitespace(character)) {
                    // First non whitespace character in the token
                    builder = []
                    builder.push(character);

                    // Complete token if a single character token
                    if (!StringReader.isTokenCharacter(character)) {
                        break;
                    }

                }

                // Read the next character
                characterNum = this.readCharacter();
            }

            if (builder != null) {
                token = builder.join("");
            }

        }
        return token;
    }

    /**
     * Peek at the next token without reading past it
     * @return next token
     */
    public peekToken(): string {
        if (this.nextToken == null) {
            this.nextToken = this.readToken();
        }
        return this.nextToken;
    }

    /**
     * Read a double
     * @return number
     */
    public readDouble(): number {
        const token = this.readToken();
        if (token == null) {
            throw new SFException("Failed to read expected double value");
        }
        return Number.parseFloat(token);
    }

    /**
     * Check if the character is a contiguous block token character: ( [a-z] | [A-Z] | [0-9] | - | . | + )
     *
     * @param c
     * @return
     */
    private static isTokenCharacter (c: string): boolean {
        return c.match(new RegExp(/[a-z]|[A-Z]|[0-9]|-|\.|\+/)) != null;
    }

    /**
     * Check if the character is whitespace or a space character
     * @param c character
     * @return true if whitespace
     */
    private static isWhitespace(c: string): boolean {
        return c.trim().length === 0;
    }
}