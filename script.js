console.log("Spotify Clone Initialized");

let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currFolder = "";

// Use a dynamic base URL so it works regardless of your port (3000 vs 5500)
const BASE_URL = "http://127.0.0.1:3000/Spotify%20Project/songs";

function formatTime(seconds) {
    if (isNaN(seconds)) {
        return "00:00";
    }
    let minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function getFolders() {
    let a = await fetch(`${BASE_URL}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let folders = [];

    for (let index = 0; index < as.length; index++) {
        let element = as[index];
        let href = element.getAttribute("href");

        // Check if href exists and ignore parent directory links
        if (href && !href.startsWith("..") && href !== "/" && href !== "\\") {

            // FIX 1: Decode the string FIRST so %5C turns back into a real backslash (\)
            let decodedHref = decodeURIComponent(href);

            // FIX 2: Now split by BOTH forward slashes (/) and backslashes (\)
            let parts = decodedHref.split(/[\\/]/).filter(p => p !== '');
            let folderName = parts[parts.length - 1];

            // Prevent adding the root directories themselves
            if (folderName && folderName !== "songs" && !folderName.includes("Spotify Project")) {
                if (!folders.includes(folderName)) {
                    folders.push(folderName);
                }
            }
        }
    }
    console.log("Folders found:", folders);
    return folders;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`${BASE_URL}/${encodeURIComponent(folder)}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    let folderSongs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        let href = element.getAttribute("href");

        // Check href to avoid name truncation issues
        if (href && href.endsWith(".mp3")) {
            // FIX 3: Apply the exact same decode-then-split logic to the songs
            let decodedHref = decodeURIComponent(href);
            let parts = decodedHref.split(/[\\/]/).filter(p => p !== '');
            let songName = parts[parts.length - 1];

            folderSongs.push(songName);
        }
    }
    console.log("Songs in", folder, ":", folderSongs);
    return folderSongs;
}

const playMusic = (track, pause = false) => {
    // track is already decoded in the array, so we encode it for the browser source URL
    currentSong.src = `${BASE_URL}/${encodeURIComponent(currFolder)}/${encodeURIComponent(track)}`;

    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = track;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

function displaySongs() {
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Unknown Artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>
        `;
    }

    // Attach click events to the new song list items
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, index) => {
        e.addEventListener("click", () => {
            currentIndex = index;
            playMusic(songs[currentIndex]);
        });
    });
}

async function displayFolders() {
    let folders = await getFolders();
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const folder of folders) {
        cardContainer.innerHTML += `
        <div class="card" data-folder="${folder}">
            <img class="image" src="${BASE_URL}/${encodeURIComponent(folder)}/cover.jpg" alt="">
            <h2>${folder}</h2>
            <p>Music Playlist</p>
        </div>
    `;
    }

    Array.from(cardContainer.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            let folder = card.getAttribute("data-folder");
            songs = await getSongs(folder);
            currentIndex = 0;

            if (songs.length === 0) {
                console.log("No songs found in this folder");
                document.querySelector(".songList ul").innerHTML = "<li>No songs found</li>";
                return;
            }

            playMusic(songs[currentIndex], true);
            displaySongs();
        });
    });
}

// --- Event Listeners ---

document.getElementById("play").addEventListener("click", () => {
    let playBtn = document.getElementById("play");
    if (currentSong.paused && currentSong.src) {
        currentSong.play();
        playBtn.src = "pause.svg";
    } else if (!currentSong.paused) {
        currentSong.pause();
        playBtn.src = "play.svg";
    }
});

currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    if (currentSong.duration) {
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
});

document.querySelector(".seekbar").addEventListener("click", e => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
});

document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
});

document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
});

document.getElementById("next").addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
        currentIndex++;
        playMusic(songs[currentIndex]);
    }
});

document.getElementById("previous").addEventListener("click", () => {
    if (currentIndex > 0) {
        currentIndex--;
        playMusic(songs[currentIndex]);
    }
});

document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
    currentSong.volume = parseInt(e.target.value) / 100;
});

async function main() {
    await displayFolders();
}

main();