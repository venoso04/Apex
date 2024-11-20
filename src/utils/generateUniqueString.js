import { nanoid } from "nanoid"

// 1-initiate the the generation function which will take the length of the string as a parameter
let generateUniqueString = (length) =>{
    return nanoid(length)
}

export default generateUniqueString