import { UnyRandom } from './uny-random.min.js';
const unyRandom = new UnyRandom();

// encrypt = ture , decrypt = false
function scramble(input, shuffling = false) {
    const base64strings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let result = "";
    for (let i = 0; i < input.length; i++) {
        let currentChar = input.charAt(i);
        let index = base64strings.indexOf(currentChar);
        if (index !== -1) {
            let randomNum = unyRandom.range(0, 65);
            let a = (shuffling ? 1 : -1) * randomNum;
            let b = index + a;
            let c = Mod(b, 65);
            result += base64strings[c];
        }
    }
    return result;
}

function EncodePlayerName(playerName)
{
    var filteredString = playerName.replace("A", "");
        filteredString = filteredString.replace("E", "");
        filteredString = filteredString.replace("O", "");
        filteredString = filteredString.replace(" ", "");
    return filteredString;
}

// some important decode/decrypt missing
// ...
// give star to unlock full source

function MakeSave(playerName = 'test', s)
{
  // give star to unlock full source
}

export { MakeSave };
