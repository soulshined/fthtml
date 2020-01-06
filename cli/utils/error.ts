export default function (message: string, exit?: boolean) {
    console.error(message)
    exit && process.exit(1)
}