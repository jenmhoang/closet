const WEATHER = {
    "cold": 1,
    "neutral": 2,
    "warm": 3,
    "hot": 4
}

const ITEM_TYPES = {
    "top": 1,
    "bottom": 2,
    "layer": 3,
    "socks": 4,
    "accessory": 5,
    "shoes": 6
}

const STAR_UNICODE = '\u2605'

let outfits = []
let items = []

class Item {
    constructor(name, type, wishlist=false, worn=false) {
        this.name = name;
        this.type = type;
        this.wishlist = wishlist;
        this.worn = worn;
        this.outfits = []
    }
}

class Outfit {
    constructor(items, weather, stars) {
        this.items = items;
        this.weather = weather;
        this.stars = stars;
    }

    isAvailable() {
        for (const item of this.items) {
            if (item.worn) {
                return false;
            }
        }
        return true;
    }

    isWishlist() {
        for (const item of this.items) {
            if (item.wishlist) {
                return true;
            }
        }
        return false;
    }
}



function getItemByName(name) {
    for (const item of items) {
        if (name == item.name)
            return item
    }
}


function saveData() {
    localStorage.setItem("items", JSON.stringify(items, null, 2))
    localStorage.setItem("outfits", JSON.stringify(outfits, null, 2))
}


function getSavedData() {
    jsonItems = localStorage.getItem("items");
    parsedItems = JSON.parse(jsonItems) || []
    items = parsedItems.map(item => new Item(item.name, item.type, item.wishlist, item.worn))

    jsonOutfits = localStorage.getItem("outfits");
    parsedOutfits = JSON.parse(jsonOutfits) || []

    for (outfit of parsedOutfits) {
        const outfitItems = outfit.items.map(item => getItemByName(item.name))
        outfits.push(new Outfit(outfitItems, outfit.weather, outfit.stars))
    }
}


function showItems() {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()
    for (const item of items) {
        createItemComponent(item)
    }
}


async function createItemComponent(item) {
    const response = await fetch('components/item.html');
    const text = await response.text();
    const parser = new DOMParser();
    const itemSourceDoc = parser.parseFromString(text, 'text/html');
    const itemComponent = itemSourceDoc.querySelector('.component');

    updateItemComponentInfo(item, itemComponent);

    // populate item edit info
    const nameInput = itemComponent.querySelector('.iename');
    nameInput.value = item.name;
    const typeDropdown = itemComponent.querySelector('.ietype');
    populateDropdown(typeDropdown, Object.keys(ITEM_TYPES), null, defaultValue=item.type);
    const wishlistCheckbox = itemComponent.querySelector('.iewishlist');
    wishlistCheckbox.checked = item.wishlist;
    const wornCheckbox = itemComponent.querySelector('.ieworn')
    wornCheckbox.checked = item.worn;

    //TODO: can't be worn and a wishlist

    // helper for use by button listeners
    function scrollToFit() {
        // scroll into view
        if (itemComponent.open) {
            setTimeout(() => {
                itemComponent.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 50);
        }
    }

    // add button listeners
    const editButton = itemComponent.querySelector(".cedit-button");
    editButton.addEventListener("click", () => {
        toggleEditing(itemComponent);
        scrollToFit()
    })

    const updateButton = itemComponent.querySelector(".cupdate-button");
    updateButton.addEventListener("click", () => {
        item.name = nameInput.value;
        item.type = typeDropdown.value;
        item.wishlist = wishlistCheckbox.checked;
        item.worn = wornCheckbox.checked;

        updateItemComponentInfo(item, itemComponent)
        toggleEditing(itemComponent, false)
        scrollToFit()
        saveData()
    })

    const deleteButton = itemComponent.querySelector(".cdelete-button");
    deleteButton.addEventListener("click", () => {
        items = items.filter(currItem => currItem !== item)
        saveData()
        showItems()
    })

    // add component closed listener
    itemComponent.addEventListener('toggle', () => {
        toggleEditing(itemComponent, false)
        scrollToFit()
    })

    // add item component to document
    if (itemComponent) {
        const targetItemsDiv = document.getElementById('components-list');
        targetItemsDiv.appendChild(itemComponent);
    }
}

function updateItemComponentInfo(item, itemComponent) {
    itemComponent.querySelector('.iname').textContent = item.name;
    let itemInfo = `${item.type}`
    if (item.wishlist) { itemInfo += "\nwishlist" }
    if (item.worn) { itemInfo += "\nworn"}
    itemComponent.querySelector(".cinfo").textContent = itemInfo;
}


/**
 * Adds Item object to list of items
 * based off of form info
 */
function addItem() {
    const nameInput = document.getElementById("ainame");
    const name = nameInput.value;
    const typeDropdown = document.getElementById("aitype");
    const type = typeDropdown.value;
    const wishlistCheckbox = document.getElementById("aiwishlist");
    const wishlist = wishlistCheckbox.checked;

    // add item to list
    let nameValidity = ""
    if (!name) {
        nameValidity = "Invalid field"
    } else if (items.map(item => item.name).includes(name)) {
        nameValidity = "Item already exists."
    }
    nameInput.setCustomValidity(nameValidity)
    
    let typeValidity = type ? "" : "Select a type."
    typeDropdown.setCustomValidity(typeValidity)

    if (nameValidity || typeValidity) {
        return
    } else {
        items.push(new Item(name, type, wishlist))
    }

    saveData()
    showItems()
}






function showOutfits() {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()
    for (const outfit of outfits) {
        createOutfitComponent(outfit)
    }
}


async function createOutfitComponent(outfit) {
    const response = await fetch('components/outfit.html');
    const text = await response.text();
    const parser = new DOMParser();
    const outfitSourceDoc = parser.parseFromString(text, 'text/html');
    const outfitComponent = outfitSourceDoc.querySelector('.component');

    updateOutfitComponentInfo(outfit, outfitComponent);

    // populate item edit info
    const itemsSelect = outfitComponent.querySelector('.oeitems');
    populateDropdown(itemsSelect, items.map(item => item.name), null, 
                     defaultValue=outfit.items.map(item => item.name))
    const weatherDropdown = outfitComponent.querySelector('.oeweather')
    populateDropdown(weatherDropdown, Object.keys(WEATHER), null, defaultValue=outfit.weather)
    const starsDropdown = outfitComponent.querySelector('.oestars');
    const starsValueList = [...Array(5).keys()].map(n => n + 1)
    const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE))
    populateDropdown(starsDropdown, starSymbolsList, starsValueList, outfit.stars)

    const ieWornCheckbox = outfitComponent.querySelector('.oeworn')
    ieWornCheckbox.checked = !outfit.isAvailable()

    // helper for use by button listeners
    function scrollToFit() {
        // scroll into view
        if (outfitComponent.open) {
            setTimeout(() => {
                outfitComponent.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }, 50);
        }
    }

    // add button listeners
    const editButton = outfitComponent.querySelector(".cedit-button");
    editButton.addEventListener("click", () => {
        toggleEditing(outfitComponent);
        scrollToFit()
    })

    const updateButton = outfitComponent.querySelector(".cupdate-button");
    updateButton.addEventListener("click", () => {
        const selectedItemNames = Array.from(itemsSelect.selectedOptions).map(option => option.value);
        const selectedItems = selectedItemNames.map(itemName => getItemByName(itemName));
        const weather = weatherDropdown.value;
        const stars = parseInt(starsDropdown.value, 10);
        outfit.items = selectedItems;
        outfit.weather = weather;
        outfit.stars = stars;

        if (!ieWornCheckbox.checked != outfit.isAvailable()) {
            for (item of outfit.items) {
                item.worn = ieWornCheckbox.checked;
            }
        }

        updateOutfitComponentInfo(outfit, outfitComponent);

        toggleEditing(outfitComponent, false)
        scrollToFit()
        saveData()
    })

    const deleteButton = outfitComponent.querySelector(".cdelete-button");
    deleteButton.addEventListener("click", () => {
        outfits = outfits.filter(currOutfit => currOutfit != outfit)
        saveData()
        showOutfits()
    })

    // add component closed listener
    outfitComponent.addEventListener('toggle', () => {
        toggleEditing(outfitComponent, false)
        scrollToFit()
    })

    // add item component to document
    if (outfitComponent) {
        const targetItemsDiv = document.getElementById('components-list');
        targetItemsDiv.appendChild(outfitComponent);
    }
}


function updateOutfitComponentInfo(outfit, outfitComponent) {
    const outfitItems = outfit.items.map(item => item.name).join(", ")
    outfitComponent.querySelector(".oitems").textContent = outfitItems;
    let outfitInfo = `${outfit.weather}`
    outfitInfo += `\n${Array(outfit.stars+1).join(STAR_UNICODE)}`
    if (outfit.isAvailable()) {
        outfitInfo += "\navailable \u2714"
    } else {
        outfitInfo += "\nworn"
    }
    if (outfit.isWishlist()) { outfitInfo += "\nwishlist"}
    outfitComponent.querySelector(".cinfo").textContent = outfitInfo;
}


function addOutfit() {
    const itemsSelect = document.getElementById('aoitems');
    const selectedItemNames = Array.from(itemsSelect.selectedOptions).map(option => option.value);
    const selectedItems = selectedItemNames.map(itemName => getItemByName(itemName));

    const weatherDropdown = document.getElementById('aoweather');
    const weather = weatherDropdown.value;

    const starsDropdown = document.getElementById('aostars');
    const stars = parseInt(starsDropdown.value, 10);

    const itemsValidity = selectedItems ? "" : "Select at least one item."
    itemsSelect.setCustomValidity(itemsValidity);
    const weatherValidity = weather ? "" : "Select weather."
    weatherDropdown.setCustomValidity(weatherValidity);
    const starsValidity = stars ? "" : "Select stars.";
    starsDropdown.setCustomValidity(starsValidity);

    if (itemsValidity || weatherValidity || starsValidity) {
        return
    } else {
        outfits.push(new Outfit(selectedItems, weather, stars))
    }
    
    saveData()
    showOutfits()
}




function toggleEditing(itemComponent, toggle=null) {
    editOptions = itemComponent.querySelector(".cedit")
    editing = toggle != null ? toggle : editOptions.classList.contains('hidden');
    
    editOptions.classList.toggle('hidden', !editing);
    itemComponent.querySelector(".cupdate-button").classList.toggle('hidden', !editing);
    itemComponent.querySelector(".cdelete-button").classList.toggle('hidden', !editing);
    itemComponent.querySelector(".cinfo").classList.toggle('hidden', editing);
    
    buttonText = editing ? "Cancel" : "Edit";
    itemComponent.querySelector(".cedit-button").textContent = buttonText;
}

function populateDropdown(element, textContent, value=null, defaultValue=null) {
    for (let i = 0; i < textContent.length; i++) {
        const option = document.createElement('option');
        option.textContent = textContent[i];
        if (value && (value.length == textContent.length)) {
            option.value = value[i];
        }
        else {
            option.value = textContent[i];
        }
        element.appendChild(option)
    }
    if (defaultValue) {
        if (Array.isArray(defaultValue)) {
            for (option of Array.from(element.options)) {
                option.selected = defaultValue.includes(option.value);
            }
        }
        if ((value && value.includes(defaultValue)) || textContent.includes(defaultValue)) {
            element.value = defaultValue;
        }
    }
}

function initOutfitsPage() {
    initNavbar();
    getSavedData();
    showOutfits();

    const itemsSelect = document.getElementById('aoitems')
    populateDropdown(itemsSelect, items.map(item => item.name))
    const weatherDropdown = document.getElementById('aoweather')
    populateDropdown(weatherDropdown, Object.keys(WEATHER))
    const starsDropdown = document.getElementById('aostars');
    const starsValueList = [...Array(5).keys()].map(n => n + 1)
    const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE))
    populateDropdown(starsDropdown, starSymbolsList, starsValueList)
    
    const addItemButton = document.getElementById('add-button');
    addItemButton.addEventListener("click", () => {
        const addDialog = document.getElementById("add-dialog");
        addDialog.showModal();
    })
    
    const submitItemButton = document.getElementById('add-submit');
    submitItemButton.addEventListener("click", () => {
        addOutfit();
        
        const form = document.getElementById("add-form");
        if (form.checkValidity()) {
            form.reset();
        }
    })
}

function initItemsPage() {
    initNavbar();
    getSavedData();
    showItems();

    // populate dropdowns and add events for Add Item Form
    const typesDropdown = document.getElementById('aitype')
    populateDropdown(typesDropdown, Object.keys(ITEM_TYPES));
    const addItemButton = document.getElementById('add-button');
    addItemButton.addEventListener("click", () => {
        const addDialog = document.getElementById("add-dialog");
        addDialog.showModal();
    })
    const submitItemButton = document.getElementById('add-submit');
    submitItemButton.addEventListener("click", () => {
        addItem();
        
        const form = document.getElementById("add-form");
        if (form.checkValidity()) {
            form.reset();
        }
    })
}

async function initNavbar() {
    const response = await fetch('components/nav.html');
    const text = await response.text();
    const parser = new DOMParser();
    const navSourceDoc = parser.parseFromString(text, 'text/html');
    const navSourceDiv = navSourceDoc.getElementById('navbar');

    if (navSourceDiv) {
        document.getElementById('navbar').replaceWith(navSourceDiv)
    }

    const currentPage = document.body.dataset.page;
    const navId = `${currentPage}-nav`
    const pageNavElement = document.getElementById(navId)
    pageNavElement.className = "active"
}
