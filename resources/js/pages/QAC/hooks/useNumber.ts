import { sanitizeNumberInput, toNumber, toFixed } from "../utils/number";

export const useNumber = () => {
    return {
        sanitizeNumberInput,
        toNumber,
        toFixed
    };
};
