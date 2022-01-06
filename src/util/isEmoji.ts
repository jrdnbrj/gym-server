export const isEmoji = (text: string): boolean => {
    const regex = /\p{Extended_Pictographic}/gu;
    return regex.test(text);
};
