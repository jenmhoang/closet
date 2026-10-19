const WEATHER = {
    "cold": 1,
    "neutral": 2,
    "warm": 3,
    "hot": 4
}

const ITEM_TYPES = {
    'top': 1,
    'sweater': 2,
    'cardigan': 3,
    'skirt': 4,
    'dress': 5,
    'pants': 6,
    'socks': 7,
    'accessory': 8,
    'outerwear': 9,
    'shoes': 10
}

const ITEM_COLORS = {
    "pink": {
        "light": "rgb(255, 234, 246)",
        "mid": "rgb(233, 154, 200)",
        "dark": "rgb(177, 62, 129)",
    },
    "white": {
        "light": "rgb(245, 245, 245)",
        "mid": "rgb(221, 221, 221)",
        "dark": "rgb(58, 58, 58)"
    },
    "blue": {
        "light": "rgb(234, 243, 255)",
        "mid": "rgb(194, 205, 255)",
        "dark": "rgb(49, 71, 145)"
    },
    "purple": {
        "light": "rgb(247, 234, 255)",
        "mid": "rgb(228, 194, 255)",
        "dark": "rgb(125, 71, 168)",
    },
    "red": {
        "light": "rgb(255, 234, 239)",
        "mid": "rgb(206, 126, 143)",
        "dark": "rgb(143, 38, 65)"
    },
    "burgundy": {
        "light": "rgb(255, 234, 239)",
        "mid": "rgb(206, 126, 143)",
        "dark": "rgb(143, 38, 65)"
    },
    "black": {
        "light": "rgb(212, 212, 212)",
        "mid": "rgb(94, 94, 94)",
        "dark": "rgb(0, 0, 0)"
    },
    "cream": {
        "light": "rgb(255, 243, 234)",
        "mid": "rgb(235, 204, 190)",
        "dark": "rgb(129, 66, 37)"
    },
    "beige": {
        "light": "rgb(255, 243, 234)",
        "mid": "rgb(248, 225, 214)",
        "dark": "rgb(129, 66, 37)"
    },
    "pearl": {
        "light": "rgb(238, 238, 238)",
        "mid": "rgb(221, 221, 221)",
        "dark": "rgb(58, 58, 58)"
    },
}

WEATHER_COLORS = {
    "cold": "#bdd8f2",
    "neutral":  "#d4c0b4",
    "warm": "#f7bf83",
    "hot": "#f5a4a4"
}

const STAR_UNICODE = '\u2605' 

var outfits = []
var items = []


class Item {
    constructor(name, type, image=null, wishlist=false, worn=false) {
        this.name = name;
        this.type = type;
        this.image = image;
        this.wishlist = wishlist;
        this.worn = worn;
        this.outfits = []
    }
}


class Outfit {
    constructor(id, items, weather, stars, image=null) {
        this.id = id;
        this.items = items;
        this.weather = weather;
        this.stars = stars;
        this.image = image;

        for (const item of this.items) {
            if (!item.outfits.includes(this.id)) {
                item.outfits.push(this.id)
            }
        }
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


function getDefaultItemsSort(itemsList) {
    return itemsList.toSorted((a, b) => {
        return a.name.localeCompare(b.name);
    }).toSorted((a, b) => {
        return ITEM_TYPES[a.type] - ITEM_TYPES[b.type];
    });
}


function getDefaultOutfitsSort(outfitsList) {
    return outfitsList.toSorted((a, b) => {
        return b.stars - a.stars;
    }).toSorted((a, b) => {
        return WEATHER[a.weather] - WEATHER[b.weather];
    });
}


function getObjectStore(storeName, mode, callback) {
    const request = indexedDB.open("ClosetDB", 1);
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("itemsStore")) {
            db.createObjectStore("itemsStore", { keyPath: "name" });
        }
        if (!db.objectStoreNames.contains("outfitsStore")) {
            db.createObjectStore("outfitsStore", { keyPath: "id" });
        }
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        callback(store);
        
        transaction.oncomplete = function() {
            db.close();
        };
    };

    request.onerror = function(event) {
        console.error("Database error: ", event.target.error);
    };
}


function saveData() {
    getObjectStore('itemsStore', 'readwrite', function(store) {
        store.clear();
        items.forEach((item) => {
            store.put(item);
        })
    })

    getObjectStore('outfitsStore', 'readwrite', function(store) {
        store.clear();
        outfits.forEach((outfit) => {
            store.put(outfit);
        })
    })
}


function getSavedData() {
    return new Promise((resolve) => {
        getObjectStore('itemsStore', 'readonly', function(itemsStore) {
            const itemsRequest = itemsStore.getAll();
            itemsRequest.onsuccess = () => {
                const itemsDictList = itemsRequest.result;

        getObjectStore('outfitsStore', 'readonly', function(outfitsStore) {
            const outfitsRequest = outfitsStore.getAll();
            outfitsRequest.onsuccess = () => {
                const outfitsDictList = outfitsRequest.result;
                loadData(itemsDictList, outfitsDictList);
                resolve();
            }
        });
            };
        });
    })
}


function loadData(parsedItems, parsedOutfits) {
    items = parsedItems.map(item => new Item(item.name, item.type, item.image, item.wishlist, item.worn))
    outfits = []
    for (const outfit of parsedOutfits) {
        const outfitItems = outfit.items.map(item => getItemByName(item.name))
        outfits.push(new Outfit(outfits.length, outfitItems, outfit.weather, parseInt(outfit.stars, 10), outfit.image));
    }
}


function showItems(focus=null) {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()

    filteredItems = getDefaultItemsSort(items);

    const urlParams = new URLSearchParams(window.location.search);
    const outfitId = urlParams.get('outfit');
    if (outfitId) {
        const filterIndicator = document.querySelector('filter-indicator');
        filterIndicator.show(outfitId)
        filteredItems = filteredItems.filter(item => item.outfits.includes(parseInt(outfitId, 10)));
    }
    let search = urlParams.get('search');
    if (search) {
        let searchWords = [];
        if (search.includes('"')) {
            const regex =/"([^"]*)"/g;
            searchWords = Array.from(search.matchAll(regex), m => m[1]);
            search = search.replaceAll('"', '')
            for (const searchWord of searchWords) {
                search = search.replace(searchWord, '');
            }
        }
        if (search) searchWords = searchWords.concat(search.trim().split(" "));
        filteredItems = filteredItems.filter(item => {
            return searchWords.some(word => item.name.includes(word));
        })
    }
    const types = urlParams.getAll('type');
    if (types.length > 0) {
        filteredItems = filteredItems.filter(item => types.includes(item.type))
    }
    const worn = urlParams.get('worn');
    if (worn != null) {
        filteredItems = filteredItems.filter(item => item.worn == worn)
    }
    const wishlist = urlParams.get('wishlist');
    if (wishlist != null) {
        filteredItems = filteredItems.filter(item => item.wishlist == wishlist)
    }

    const sortby = urlParams.get('sortby')
    if (sortby != null) {
        filteredItems = filteredItems.toSorted((a, b) => {
            const aVal = a[sortby];
            const bVal = b[sortby];

            if (sortby == 'type') {
                return ITEM_TYPES[aVal] - ITEM_TYPES[bVal];
            }
        
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return aVal.localeCompare(bVal);
            }       
            return aVal - bVal;
        })
    }

    let focusComponent = null
    for (const item of filteredItems) {
        const component = new ItemComponent(item)
        if (focus && focus == item.name) {
            focusComponent = component;
        }
        componentsDiv.appendChild(component);
    }

    if (focusComponent) {
        focusComponent.scrollToFit(true);
    }
}


function showOutfits(focus=null) {
    const componentsDiv = document.getElementById('components-list')
    componentsDiv.replaceChildren()
    
    filteredOutfits = getDefaultOutfitsSort(outfits);

    const urlParams = new URLSearchParams(window.location.search);
    const itemName = urlParams.get('item');
    if (itemName) {
        const filterIndicator = document.querySelector('filter-indicator');
        filterIndicator.show(itemName)
        const item = getItemByName(itemName)
        filteredOutfits = filteredOutfits.filter(outfit => item.outfits.includes(outfit.id))
    }
    let search = urlParams.get('search');
    if (search) {
        let searchWords = [];
        if (search.includes('"')) {
            const regex =/"([^"]*)"/g;
            searchWords = Array.from(search.matchAll(regex), m => m[1]);
            search = search.replaceAll('"', '')
            for (const searchWord of searchWords) {
                search = search.replace(searchWord, '');
            }
        }
        if (search) searchWords = searchWords.concat(search.trim().split(" "));
        filteredOutfits = filteredOutfits.filter(outfit => {
            return searchWords.some(word => outfit.items.map(item => item.name).join(' ').includes(word));
        })
    }
    const weather = urlParams.getAll('weather');
    if (weather.length > 0) {
        filteredOutfits = filteredOutfits.filter(outfit => weather.includes(outfit.weather))
    }
    const stars = urlParams.getAll('stars');
    if (stars.length > 0) {
        const starsInt = stars.map(starsString => parseInt(starsString, 10));
        filteredOutfits = filteredOutfits.filter(outfit => starsInt.includes(outfit.stars))
    }
    const available = urlParams.get('available');
    if (available != null) {
        filteredOutfits = filteredOutfits.filter(outfit => outfit.isAvailable() == available)
    }
    const wishlist = urlParams.get('wishlist');
    if (wishlist != null) {
        filteredOutfits = filteredOutfits.filter(outfit => outfit.isWishlist() == wishlist)
    }

    const sortby = urlParams.get('sortby')
    if (sortby != null) {
        filteredOutfits = filteredOutfits.toSorted((a, b) => {
            const aVal = a[sortby];
            const bVal = b[sortby];

            if (sortby == 'weather') {
                return WEATHER[aVal] - WEATHER[bVal];
            }
            
            return bVal - aVal;
        })
    }

    let focusComponent = null
    for (const outfit of filteredOutfits) {
        const component = new OutfitComponent(outfit)
        if (focus && focus == outfit.id) {
            focusComponent = component;
        }
        componentsDiv.appendChild(component);
    }

    if (focusComponent) {
        focusComponent.scrollToFit(true);
    }
}


function populateDropdown(element, textContent, value=null, defaultValue=null) {
    element.innerHTML= '';
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
            for (const option of Array.from(element.options)) {
                option.selected = defaultValue.includes(option.value);
            }
        }
        if ((value && value.includes(defaultValue)) || textContent.includes(defaultValue)) {
            element.value = defaultValue;
        }
    }
}


function initAddOutfitButton() {
    const bottomSheet = document.querySelector('bottom-sheet');
    
    const addOutfitButton = document.getElementById('add-button');
    addOutfitButton.addEventListener("click", () => {
        const outfitAdd = new OutfitAdd();
        bottomSheet.addStep(outfitAdd, "Add Outfit")

        outfitAdd.addEventListener('add-submitted', (event) => {
            showOutfits(event.detail.id);
            bottomSheet.closeSheet();
        }, {once: true})
        
        bottomSheet.openSheet()
    })
}


function initAddItemButton() {
    const bottomSheet = document.querySelector('bottom-sheet');
    
    const addItemButton = document.getElementById('add-button');
    addItemButton.addEventListener("click", () => {
        const itemAdd = new ItemAdd();
        bottomSheet.addStep(itemAdd, "Add Item")

        itemAdd.addEventListener('add-submitted', (event) => {
            showItems(event.detail.name);
            bottomSheet.closeSheet();
        }, {once: true})

        bottomSheet.openSheet()
    })
}


function initFilterSortButtons() {
    const filterButton = document.getElementById('filter-button')
    filterButton.addEventListener("click", () => {
        const itemFilter = document.querySelector(".filter");
        itemFilter.classList.toggle("hidden");
    })

    const sortButton = document.getElementById('sort-button')
    sortButton.addEventListener("click", () => {
        const itemSort = document.querySelector(".sort");
        itemSort.classList.toggle("hidden");
    })
}


async function initOutfitsPage() {
    await getSavedData();
    showOutfits();
    initAddOutfitButton();
    initFilterSortButtons();
}

async function initItemsPage() {
    await getSavedData();
    showItems();
    initAddItemButton();
    initFilterSortButtons();
}


function initSettingsPage() {
    getSavedData();

    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('jsonFileInput');
    const status = document.getElementById('status');

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const jsonFile = fileInput.files[0];
        try {
            const [uploadedItems, uploadedOutfits] = await (async () => {
                const jsonText = await jsonFile.text();
                jsonData = JSON.parse(jsonText);
                return [jsonData['items'], jsonData['outfits']];
            })();
            loadData(uploadedItems, uploadedOutfits);
            saveData();
            status.textContent = "Uploaded successfully."
        }
        catch (error) {
            fileInput.setCustomValidity("Could not parse uploaded json.")
            console.error("Error reading JSON:", error)
            return
        }
    });

    const saveDataButton = document.getElementById('saveDataButton')
    saveDataButton.addEventListener('click', async () => {
        const closet_data = {
            "items": items,
            "outfits": outfits
        }
        const now = new Date();

        let yyyymmddhhmmss = `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}`
        yyyymmddhhmmss += `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`
        
        const closet_data_json = JSON.stringify(closet_data, null, 2);
        const blob = new Blob([closet_data_json], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `closet_data_${yyyymmddhhmmss}.json`;
        link.click()
        URL.revokeObjectURL(link.href);
    })

}


class NavBar extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/nav.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;

            // set up highlight
            const currentPage = document.body.dataset.page;
            const navClass = `.${currentPage}-nav`;
            const pageNavElement = this.querySelector(navClass);
            pageNavElement.classList.toggle('active', true);
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }
}
customElements.define('nav-bar', NavBar);


class SortBy extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `<div id="sort"></div>`;
        this.setup();
    }

    setup() {
        const sortDiv = document.getElementById('sort');

        const params = this.getAttribute('params');
        for (const param of params.split(',')) {
            const button = document.createElement('button');
            button.textContent = param;
            sortDiv.appendChild(button);
        }

        const buttons = this.querySelectorAll('button');
        const urlParams = new URLSearchParams(window.location.search);
        const sortby = urlParams.get('sortby')
        buttons.forEach(button => {
            if (sortby && sortby == button.textContent.toLowerCase()) {
                button.classList.toggle('active', true)
            }

            button.addEventListener("click", () => {
                const url = new URL(window.location.href);
                const param = button.textContent.toLowerCase();
                if (url.searchParams.get('sortby') == param) {
                    url.searchParams.delete('sortby');
                    button.classList.remove('active');
                } else {
                    url.searchParams.set('sortby', param);
                    buttons.forEach((btn) => btn.classList.remove('active'));
                    button.classList.add('active');
                }
                window.history.pushState({}, '', url);

                const currentPage = document.body.dataset.page;
                if (currentPage == 'items') {
                    showItems();
                } else if (currentPage == 'outfits') {
                    showOutfits();
                }

                setTimeout(() => {
                    this.classList.toggle('hidden', true);
                }, 200)
            })
        })
    }
}
customElements.define('sort-by', SortBy);


class ItemInput extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/item-input.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.nameInput = this.querySelector('.name-input');
        this.typeSelect = this.querySelector('.type-select');
        this.imageInput = this.querySelector('.image-input');
        this.wornCheckbox = this.querySelector('.worn-checkbox');
        this.wishlistCheckbox = this.querySelector('.wishlist-checkbox');

        // set up name input clear button
        this.nameClearButton = this.querySelector('.clear-button');
        this.nameClearButton.addEventListener("click", () => {
            this.nameInput.value = '';
        })

        // populate dropdowns and add events submission
        populateDropdown(this.typeSelect, Object.keys(ITEM_TYPES));
        this.typeSelect.selectedIndex = -1;

        this.submitButton = this.querySelector('.submit-button');
        this.submitButton.addEventListener("click", () => {
            this.handleSubmit()
        })
    }

    handleSubmit() {}
}


class ItemAdd extends ItemInput {
    constructor(defaultName="") {
        super();
        this.defaultName = defaultName;
    }

    setup() {
        super.setup();
        if (this.defaultName) {
            this.nameInput.value = this.defaultName;
        }
    }

    validateFields() {
        const name = this.nameInput.value;
        const type = this.typeSelect.value;

        let nameValidity = ""
        if (!name) {
            nameValidity = "Invalid field"
        } else if (items.map(item => item.name).includes(name)) {
            nameValidity = "Item already exists."
        }
        this.nameInput.setCustomValidity(nameValidity)
        
        let typeValidity = type ? "" : "Select a type."
        this.typeSelect.setCustomValidity(typeValidity)

        if (nameValidity || typeValidity) {
            const form = this.querySelector("form");
            if (form.reportValidity()) {
                form.reset();
            }
            return false;
        } else {
            return true;
        }
    }

    handleSubmit() {
        const name = this.nameInput.value;
        const type = this.typeSelect.value;
        const imageInput = this.imageInput.files[0];
        const wishlist = this.wishlistCheckbox.checked;

        if (this.validateFields()) {
            const newItem = new Item(name, type, imageInput, wishlist)
            items.push(newItem);
            saveData();
            this.dispatchEvent(new CustomEvent('add-submitted', {
                detail: newItem
            }));
        }
    }
}
customElements.define('item-add', ItemAdd);


class ItemEdit extends ItemInput {
    constructor(item, itemComponent) {
        super();
        this.item = item;
        this.itemComponent = itemComponent;
    }

    setup() {
        super.setup()
        this.nameInput.value = this.item.name;
        this.typeSelect.value = this.item.type;
        this.wornCheckbox.checked = this.item.worn;
        this.wishlistCheckbox.checked = this.item.wishlist;
    }

    handleSubmit() {
        this.item.name = this.nameInput.value;
        this.item.type = this.typeSelect.value;
        this.item.image = this.imageInput.files[0];
        this.item.worn = this.wornCheckbox.checked;
        this.item.wishlist = this.wishlistCheckbox.checked;

        this.dispatchEvent(new CustomEvent('editing-submitted', {}));
    }
}
customElements.define('item-edit', ItemEdit);


class ItemFilter extends ItemInput {
    constructor() {
        super();
    }

    setup() {
        super.setup()

        // change Submit button to Filter, show Reset button
        const submitButton = this.querySelector('.submit-button');
        submitButton.textContent = "Filter";
        const resetButton = this.querySelector('.reset-button');
        resetButton.classList.remove('hidden');
        resetButton.addEventListener("click", () => {
            setTimeout(() => {
                this.updateFilterParams();
            }, 1);
        })

        // change name input to search
        this.nameInput.parentElement.firstChild.textContent = "Search"

        // remove image input
        this.imageInput.parentElement.classList.add('hidden');

        // make type dropdown multi select
        this.typeSelect.multiple = true;

        // change checkboxes to tristate checkboxes
        this.triStateWornCheckbox = new TriStateCheckbox();
        this.wornCheckbox.replaceWith(this.triStateWornCheckbox);
        this.triStateWishlistCheckbox = new TriStateCheckbox();
        this.wishlistCheckbox.replaceWith(this.triStateWishlistCheckbox);

        // display current selections
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search');
        if (search) {
            this.nameInput.value = search;
        }
        const types = urlParams.getAll('type');
        if (types.length > 0) {
            for (const option of this.typeSelect.options) {
                option.selected = types.includes(option.value);
            }
        }
        const worn = urlParams.get('worn');
        if (worn != null) {
            this.triStateWornCheckbox.currState = worn;
        }
        const wishlist = urlParams.get('wishlist');
        if (wishlist != null) {
            this.triStateWishlistCheckbox.currState = wishlist;
        }
    }

    updateFilterParams() {
        const search = this.nameInput.value;
        const types = Array.from(this.typeSelect.selectedOptions).map(option => option.value);
        const worn = this.triStateWornCheckbox.currState;
        const wishlist = this.triStateWishlistCheckbox.currState;

        const url = new URL(window.location.href);

        if (search) {
            url.searchParams.set('search', search);
        } else {
            url.searchParams.delete('search');
        }

        url.searchParams.delete('type');
        types.forEach(type => url.searchParams.append('type', type));

        if (worn == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('worn')
        } else {
            url.searchParams.set('worn', worn);
        }
        
        if (wishlist == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('wishlist')
        } else {
            url.searchParams.set('wishlist', wishlist);
        }
        
        window.history.pushState({}, '', url);

        showItems();
        this.classList.toggle("hidden", true);
    }

    handleSubmit() {
        this.updateFilterParams();
    }
}
customElements.define('item-filter', ItemFilter);


class TriStateCheckbox extends HTMLElement {
    static state = {
        EXCLUDE: 0,
        INCLUDE: 1,
        NEUTRAL: 2
    }

    constructor() {
        super();
        this.currState = TriStateCheckbox.state.NEUTRAL;
    }

    async connectedCallback() {
        this.innerHTML = "<input type='checkbox'>"
        this.setup()
    }

    setup() {
        const checkbox = this.querySelector('input')
        checkbox.addEventListener('click', (e) => {    
            this.currState = (this.currState + 2) % 3; // 2 comes from (-1 + 3) to reverse modulo 3

            if (this.currState === TriStateCheckbox.state.EXCLUDE) {
                checkbox.checked = false;
                checkbox.indeterminate = true;
            } else if (this.currState === TriStateCheckbox.state.INCLUDE) {
                checkbox.checked = true;
                checkbox.indeterminate = false;
            } else if (this.currState === TriStateCheckbox.state.NEUTRAL) {
                checkbox.checked = false;
                checkbox.indeterminate = false;
            }
        });

        const parentForm = this.closest('form'); 
        parentForm.addEventListener('reset', () => {
            setTimeout(() => {
                this.currState = TriStateCheckbox.state.NEUTRAL;
                checkbox.checked = false;
                checkbox.indeterminate = false;
            }, 0);
        });
    }
}
customElements.define('tristate-checkbox', TriStateCheckbox);


class BottomSheet extends HTMLElement {
    constructor() {
        super();
        this._isConnectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/bottom-sheet.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        const backdrop = document.getElementById('backdrop');
        const closeButton = this.querySelector('.close-button');
        const closeClickButtons = [backdrop, closeButton]
        closeClickButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.closeSheet();
            });
        })

        const backButton = this.querySelector('.back-button');
        backButton.addEventListener('click', () => {
            const sheetBody = this.querySelector('.sheet-body');
            const activeStep = sheetBody.querySelector('.active');
            const currentStep = activeStep.dataset.step;
            sheetBody.removeChild(activeStep);
            if (currentStep > 1) {
                this.goToStep(currentStep - 1);
            }
        });

        this._resolveConnected();
    }

    async addStep(element, stepTitle) {
        await this._isConnectedPromise;

        const steps = this.querySelectorAll('.sheet-step');
        const currStep = steps.length + 1;
        const sheetStep = document.createElement('div');
        sheetStep.className = 'sheet-step active';
        sheetStep.dataset.step = currStep;
        sheetStep.dataset.title = stepTitle;

        sheetStep.appendChild(element);
        const sheetBody = this.querySelector('.sheet-body');
        sheetBody.appendChild(sheetStep);

        return currStep;
    }

    closeStep(stepNumber) {
        if (stepNumber > 1) {
            this.goToStep(stepNumber - 1);
        }
        const sheetBody = this.querySelector('.sheet-body');
        const targetStep = this.querySelector(`.sheet-step[data-step="${stepNumber}"]`);
        sheetBody.removeChild(targetStep);
    }

    async openSheet() {
        await this._isConnectedPromise;

        this.classList.add('show');
        document.getElementById('backdrop').classList.toggle('hidden', false);
        this.goToStep(1)
    }

    closeSheet() {
        this.classList.remove('show');
        document.getElementById('backdrop').classList.toggle('hidden', true);
        
        const sheetBody = this.querySelector('.sheet-body');
        sheetBody.replaceChildren();
    }

    goToStep(stepNumber) {
        const steps = this.querySelectorAll('.sheet-step');
        const targetStep = this.querySelector(`.sheet-step[data-step="${stepNumber}"]`);
        if (!targetStep) return;

        steps.forEach(step => step.classList.remove('active'));
        targetStep.classList.add('active');

        const headerTitle = this.querySelector('.header-title');
        headerTitle.textContent = targetStep.getAttribute('data-title');
        
        const backButton = this.querySelector('.back-button');
        if (stepNumber > 1) {
            backButton.classList.remove('hidden');
        } else {
            backButton.classList.add('hidden');
        }
    }
}
customElements.define('bottom-sheet', BottomSheet);


class ItemPill extends HTMLElement {
    constructor(item, edit=false, select=false) {
        super(item);
        this.item = item;
        this.edit = edit;
        this.select = select;
        this._isConnectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    connectedCallback() {
        this.innerHTML = `
                <span class="item-icon"></span>
                <span class="item-name">Test Item</span>
                <span class="wishlist-icon"></span>
                <span class="check-button${this.select ? "" : " hidden"}"></span>
                <button class="${this.edit ? "" : "hidden "}clear-button"></button>
        `
        this.updateInfo();
        this._resolveConnected();
    }

    async toggleSelected() {
        await this._isConnectedPromise;
        const checkIcon = this.querySelector('.check-button');
        checkIcon.classList.toggle("selected");
        this.classList.toggle("selected");
    }

    updateInfo() {
        this.querySelector('.item-name').textContent = this.item.name;
        const typeIcon = this.querySelector('.item-icon');
        typeIcon.style.setProperty('--icon-src', `url('icons/items/${this.item.type}.svg')`)
        
        for (const [color, colorValues] of Object.entries(ITEM_COLORS)) {
            if (this.item.name.includes(color)) {
                this.style.setProperty('--item-color-light', colorValues['light'])
                this.style.setProperty('--item-color-mid', colorValues['mid'])
                this.style.setProperty('--item-color-dark', colorValues['dark'])
                break;
            }
        }

        this.classList.toggle('worn', this.item.worn);
        const wishlistIcon = this.querySelector('.wishlist-icon');
        wishlistIcon.classList.toggle('hidden', !this.item.wishlist);
    }
}
customElements.define('item-pill', ItemPill);


class ItemComponent extends ItemPill {
    constructor(item) {
        super(item);
        this._isConnectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/item.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.updateInfo();

        const componentButton = this.querySelector('.component-button');
        componentButton.addEventListener('click', () => {
            this.toggleOptions();
            this.scrollToFit();
        })

        const filterButton = this.querySelector(".filter-button");
        filterButton.addEventListener("click", () => {
            this.filterOutfits()
        })

        const editButton = this.querySelector(".edit-button");
        editButton.addEventListener("click", () => {
            this.toggleEditing();
            this.scrollToFit()
        })

        const deleteButton = this.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            this.toggleOptions(false);
            for (const outfitIndex of this.item.outfits) {
                const outfit = outfits[outfitIndex];
                outfit.items.splice(outfit.items.indexOf(this.item), 1);
            }
            items.splice(items.indexOf(this.item), 1);
            saveData()
            showItems()
        })
        
        this._resolveConnected();
    }

    updateInfo() {
        super.updateInfo();
        
        if (this.item.image) {
            const imageElement = this.querySelector('.image');
            const imgUrl = URL.createObjectURL(this.item.image);
            imageElement.src = imgUrl;
        }
    }

    filterOutfits() {
        const url = new URL("index.html", window.location.href);
        url.searchParams.append('item', this.item.name);
        window.location.href = url.href;
    }
    
    toggleOptions(toggle=null) {
        const componentOptions = this.querySelector(".component-options");
        const backdrop = document.getElementById('backdrop');
        const optionsOpen = toggle != null ? toggle : componentOptions.classList.contains('hidden');

        componentOptions.classList.toggle('hidden', !optionsOpen);
        backdrop.classList.toggle('hidden', !optionsOpen);
        componentOptions.classList.toggle('active', optionsOpen);
        this.classList.toggle('active', optionsOpen);

        if (optionsOpen) {
            backdrop.addEventListener('click', () => {
                this.toggleOptions(false);
            }, {once: true})
        }
    }

    toggleEditing() {
        const bottomSheet = document.querySelector('bottom-sheet');
        const itemEdit = new ItemEdit(this.item, this);
        bottomSheet.addStep(itemEdit, "Edit Item");

        this.toggleOptions(false);
        bottomSheet.openSheet();
        
        itemEdit.addEventListener('editing-submitted', () => {
            bottomSheet.closeSheet();
            this.updateInfo();
            saveData();
            showItems(this.item.name);
        }, {once: true})
    }
    
    async scrollToFit(focus=false) {
        await this._isConnectedPromise;
        const componentOptions = this.querySelector('.component-options')
        
        if (focus || componentOptions.classList.contains('active')) {
            this.scrollIntoView({
                behavior: 'smooth', block: 'end', inline:'nearest'
            });
        }
    }
}
customElements.define('item-component', ItemComponent);


class OutfitInput extends HTMLElement {
    constructor() {
        super();
        this.currentItems = []
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/outfit-input.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.imageInput = this.querySelector('.image-input');
        this.weatherSelect = this.querySelector('.weather-select');
        this.starsSelect = this.querySelector('.stars-select');
        this.availableCheckbox = this.querySelector('.available-checkbox');
        this.wishlistCheckbox = this.querySelector('.wishlist-checkbox');

        // populate dropdowns and add events submission
        const bottomSheet = document.querySelector('bottom-sheet');
        const addItemButton = this.querySelector('.add-item-button');
        addItemButton.addEventListener("click", () => {
            const itemSelect = new ItemSelect(this.currentItems);
            bottomSheet.addStep(itemSelect, "Add Items to Outfit").then((step) => {
                bottomSheet.goToStep(step);
            })
            itemSelect.addEventListener('items-selected', (event) => {
                this.currentItems = event.detail;
                this.populateItems();
            })
        })

        populateDropdown(this.weatherSelect, Object.keys(WEATHER));
        this.weatherSelect.value = -1;
        const starsValueList = [...Array(5).keys()].map(n => n + 1);
        const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE));
        populateDropdown(this.starsSelect, starSymbolsList, starsValueList);
        this.starsSelect.value = -1;

        const submitButton = this.querySelector('.submit-button');
        submitButton.addEventListener("click", () => {
            this.handleSubmit()
        })
    }

    populateItems() {
        this.currentItems = getDefaultItemsSort(this.currentItems);
        const itemsDiv = this.querySelector('.items');
        const addItemButton = this.querySelector('.add-item-button');
        itemsDiv.replaceChildren(addItemButton);
        for (const item of this.currentItems) {
            const itemPill = new ItemPill(item, true);
            addItemButton.before(itemPill);

            const removeItemButton = itemPill.querySelector('.clear-button');
            removeItemButton.classList.add(item.name.replaceAll(" ",""))
            removeItemButton.addEventListener("click", () => {
                this.currentItems.splice(this.currentItems.indexOf(item), 1);
                itemPill.remove();
            })
        }
    }
}


class OutfitAdd extends OutfitInput {
    constructor() {
        super();
    }

    setup() {
        super.setup();
        this.availableCheckbox.parentElement.classList.add('hidden');
    }

    validateFields() {
        // const selectedItems = this.currentItems;
        const weather = this.weatherSelect.value;
        const stars = this.starsSelect.value;
        
        // const itemsValidity = selectedItems ? "" : "Select at least one item."
        // const itemsLabel = this.querySelector('.items-label');
        // itemsLabel.setCustomValidity(itemsValidity);
        const weatherValidity = weather ? "" : "Select weather."
        this.weatherSelect.setCustomValidity(weatherValidity);
        const starsValidity = stars ? "" : "Select stars.";
        this.starsSelect.setCustomValidity(starsValidity);

        if (weatherValidity || starsValidity) {
            const form = this.querySelector("form");
            if (form.reportValidity()) {
                form.reset();
            }
            return false;
        } else {
            return true;
        }
    }

    handleSubmit() {
        const selectedItems = this.currentItems;
        const imageInput = this.imageInput.files[0];
        const weather = this.weatherSelect.value;
        const stars = parseInt(this.starsSelect.value, 10);

        if (this.validateFields()) {
            const newOutfit = new Outfit(outfits.length, selectedItems, weather, stars, imageInput);
            outfits.push(newOutfit);
            saveData();
            this.dispatchEvent(new CustomEvent('add-submitted', {
                detail: newOutfit
            }));
        }
    }
}
customElements.define('outfit-add', OutfitAdd);


class OutfitEdit extends OutfitInput {
    constructor(outfit, outfitComponent) {
        super();
        this.outfit = outfit;
        this.outfitComponent = outfitComponent;
        this.currentItems = getDefaultItemsSort(this.outfit.items);
    }

    setup() {
        super.setup()
        const addItemButton = this.querySelector('.add-item-button');
        for (const item of this.currentItems) {
            const itemPill = new ItemPill(item, true);
            addItemButton.before(itemPill);
            const removeItemButton = itemPill.querySelector('.clear-button');
            removeItemButton.classList.add(item.name.replaceAll(" ",""))
            removeItemButton.addEventListener("click", () => {
                this.currentItems.splice(this.currentItems.indexOf(item), 1);
                itemPill.remove();
            })
        }
        
        populateDropdown(this.weatherSelect, Object.keys(WEATHER), null, this.outfit.weather)
        const starsValueList = [...Array(5).keys()].map(n => n + 1)
        const starSymbolsList = starsValueList.map(num => Array(num+1).join(STAR_UNICODE))
        populateDropdown(this.starsSelect, starSymbolsList, starsValueList, this.outfit.stars)
        this.availableCheckbox.checked = this.outfit.isAvailable()
    }

    async handleSubmit() {
        this.outfit.items = this.currentItems;
        this.outfit.weather = this.weatherSelect.value;
        this.outfit.stars = parseInt(this.starsSelect.value, 10);
        this.outfit.image = this.imageInput.files[0];

        if (this.availableCheckbox.checked != this.outfit.isAvailable()) {
            for (const item of this.outfit.items) {
                const excludedTypes = ['accessory', 'outerwear', 'shoes']
                if (!excludedTypes.includes(item.type)) {
                    item.worn = !this.availableCheckbox.checked;
                }
            }
        }
        this.dispatchEvent(new CustomEvent('editing-submitted', {}));
    }
}
customElements.define('outfit-edit', OutfitEdit);


class OutfitFilter extends OutfitInput {
    constructor() {
        super();
    }

    setup() {
        super.setup()
        // change Submit button to say Filter, show Reset button
        const submitButton = this.querySelector('.submit-button');
        submitButton.textContent = "Filter";
        const resetButton = this.querySelector('.reset-button');
        resetButton.classList.remove('hidden');
        resetButton.addEventListener("click", () => {
            setTimeout(() => {
                this.updateFilterParams();
            }, 1);
        })

        // reveal search input
        this.searchInput = this.querySelector('.search-input');
        this.searchInput.parentElement.classList.remove('hidden');
        this.searchClearButton = this.querySelector('.clear-button');
        this.searchClearButton.addEventListener("click", () => {
            this.searchInput.value = '';
        })

        // remove items dropdown
        const itemsDiv = this.querySelector('.items');
        itemsDiv.classList.add('hidden');
        const itemsLabel = this.querySelector('.items-label');
        itemsLabel.classList.add('hidden');

        // remove image input
        this.imageInput.parentElement.classList.add('hidden');

        // make dropdowns multi select
        this.weatherSelect.multiple = true;
        this.starsSelect.multiple = true;

        // change checkboxes to tristate checkboxes
        this.triStateAvailableCheckbox = new TriStateCheckbox();
        this.availableCheckbox.replaceWith(this.triStateAvailableCheckbox);

        // unhide wishlist option
        this.wishlistCheckbox.parentElement.classList.remove('hidden');
        this.triStateWishlistCheckbox = new TriStateCheckbox();
        this.wishlistCheckbox.replaceWith(this.triStateWishlistCheckbox);

        // display current selections
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search');
        if (search) {
            this.searchInput.value = search;
        }
        const weather = urlParams.getAll('weather');
        if (weather.length > 0) {
            for (const option of this.weatherSelect.options) {
                option.selected = weather.includes(option.value);
            }
        }
        const stars = urlParams.getAll('stars');
        if (stars.length > 0) {
            for (const option of this.starsSelect.options) {
                option.selected = stars.includes(option.value);
            }
        }
        const available = urlParams.get('available');
        if (available != null) {
            this.triStateWornCheckbox.currState = available;
        }
        const wishlist = urlParams.get('wishlist');
        if (wishlist != null) {
            this.triStateWishlistCheckbox.currState = wishlist;
        }
    }

    updateFilterParams() {
        const search = this.searchInput.value;
        const weather = Array.from(this.weatherSelect.selectedOptions).map(option => option.value);
        const stars = Array.from(this.starsSelect.selectedOptions).map(option => option.value);
        const available = this.triStateAvailableCheckbox.currState;
        const wishlist = this.triStateWishlistCheckbox.currState;
    
        const url = new URL(window.location.href);

        if (search) {
            url.searchParams.set('search', search);
        } else {
            url.searchParams.delete('search');
        }

        url.searchParams.delete('weather');
        weather.forEach(weather => url.searchParams.append('weather', weather));

        url.searchParams.delete('stars');
        stars.forEach(stars => url.searchParams.append('stars', stars));

        if (available == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('available')
        } else {
            url.searchParams.set('available', available);
        }
        
        if (wishlist == TriStateCheckbox.state.NEUTRAL) {
            url.searchParams.delete('wishlist')
        } else {
            url.searchParams.set('wishlist', wishlist);
        }
        
        window.history.pushState({}, '', url);

        showOutfits();
        this.classList.toggle("hidden", true);
    }

    handleSubmit() {
        this.updateFilterParams();
    }
}
customElements.define('outfit-filter', OutfitFilter);


class OutfitComponent extends HTMLElement {
    constructor(outfit) {
        super();
        this.outfit = outfit;
        this._isConnectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    async connectedCallback() {
        try {
            const response = await fetch('components/outfit.html');
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            this.innerHTML = doc.body.innerHTML;
            this.setup()
        } catch (error) {
            console.error(`Failed to load external html`, error);
        }
    }

    setup() {
        this.updateInfo();

        const componentButton = this.querySelector('.component-button');
        componentButton.addEventListener('click', () => {
            this.toggleOptions();
            this.scrollToFit();
        })

        const filterButton = this.querySelector(".filter-button");
        filterButton.addEventListener("click", () => {
            this.filterItems()
        })

        const editButton = this.querySelector(".edit-button");
        editButton.addEventListener("click", () => {
            this.toggleEditing();
            this.scrollToFit()
        })

        const deleteButton = this.querySelector(".delete-button");
        deleteButton.addEventListener("click", () => {
            this.toggleOptions(false);
            for (const item of this.outfit.items) {
                item.outfits.splice(item.outfits.indexOf(this.outfit.id), 1);
            }
            outfits.splice(outfits.indexOf(this.outfit), 1)
            saveData();
            showOutfits();
        })
        this._resolveConnected();
    }

    updateInfo() {
        const itemsDiv = this.querySelector('.items');
        itemsDiv.replaceChildren();
        const sortedItems = getDefaultItemsSort(this.outfit.items);
        for (const item of sortedItems) {
            const itemPill = new ItemPill(item);
            itemsDiv.appendChild(itemPill);
        }

        this.style.setProperty('--weather-color', WEATHER_COLORS[this.outfit.weather]);
        const starsElement = this.querySelector('.stars');
        starsElement.textContent = Array(this.outfit.stars + 1).join(STAR_UNICODE);
        const weatherIcon = this.querySelector('.weather-icon');
        weatherIcon.style.setProperty('--icon-src', `url('icons/weather/${this.outfit.weather}.svg')`)
        const wishlistIcon = this.querySelector('.outfit-wishlist-icon');
        wishlistIcon.classList.toggle('hidden', !this.outfit.isWishlist());
        this.classList.toggle('worn', !this.outfit.isAvailable());

        if (this.outfit.image) {
            const imageElement = this.querySelector('.image');
            const imgUrl = URL.createObjectURL(this.outfit.image);
            imageElement.src = imgUrl;
        }
    }

    filterItems() {
        const url = new URL("items.html", window.location.href);
        url.searchParams.append('outfit', this.outfit.id);
        window.location.href = url.href;
    }
    
    toggleOptions(toggle=null) {
        const componentOptions = this.querySelector(".component-options");
        const backdrop = document.getElementById('backdrop');
        const optionsOpen = toggle != null ? toggle : componentOptions.classList.contains('hidden');

        componentOptions.classList.toggle('hidden', !optionsOpen);
        backdrop.classList.toggle('hidden', !optionsOpen);
        componentOptions.classList.toggle('active', optionsOpen);
        this.classList.toggle('active', optionsOpen);

        if (optionsOpen) {
            backdrop.addEventListener('click', () => {
                this.toggleOptions(false);
            }, {once: true})
        }
    }
    
    toggleEditing() {
        const bottomSheet = new BottomSheet();
        const outfitEdit = new OutfitEdit(this.outfit, this);
        bottomSheet.addStep(outfitEdit, "Edit Outfit");
        this.appendChild(bottomSheet);
        this.toggleOptions();
        bottomSheet.openSheet();
        
        outfitEdit.addEventListener('editing-submitted', () => {
            bottomSheet.closeSheet();
            this.updateInfo();
            saveData();
            showOutfits(this.outfit.id);
        }, {once: true})
    }
    
    async scrollToFit(focus=false) {
        await this._isConnectedPromise;
        const componentOptions = this.querySelector('.component-options')
        if (focus || componentOptions.classList.contains('active')) {
            this.scrollIntoView({
                behavior: 'smooth', block: 'end', inline:'nearest'
            });
        }
    }
}
customElements.define('outfit-component', OutfitComponent);


class FilterIndicator extends HTMLElement {
    constructor(filteredBy) {
        super();
        this.innerHTML = `
            <label class="filtered-by">
                Filtered by: <span class="filtered-by-label">${filteredBy}</span>
                <button class="clear-button"></button>
            </label>
        `
        this.setup();
    }

    setup() {
        const clear = this.querySelector('.clear-button')
        clear.addEventListener("click", () => {
            const currentPage = document.body.dataset.page;
            const url = new URL(window.location.href);
            if (currentPage == "outfits") {
                url.searchParams.delete('item');
                window.history.pushState({}, '', url);
                showOutfits()
            } else if (currentPage == "items") {
                url.searchParams.delete('outfit');
                window.history.pushState({}, '', url);
                showItems()
            }
            this.classList.add('hidden')
        })
    }

    show(filteredBy) {
        const label = this.querySelector(".filtered-by-label");
        label.textContent = filteredBy;
        this.classList.remove('hidden');
    }
}
customElements.define('filter-indicator', FilterIndicator);


class ItemSelect extends HTMLElement {
    constructor(selectedItems = []) {
        super();
        this.innerHTML = `
            <form>
                <label class="search-label">
                    Search
                    <input type="text" placeholder=" " class="search-input">
                    <button type="reset" class="clear-button"></button>
                </label>
            </form>
            <div class="items">
                <button class="add-new-item-button hidden">
                    <span class="add-text"></span>
                    <span class="add-icon"></span>
                </button>
            </div>
        `
        this.itemsDiv = this.querySelector('.items');
        this.addItemButton = this.querySelector('.add-new-item-button');
        this.selectedItems = selectedItems;
        this.setup();
    }

    setup() {
        this.populateItems();

        const searchInput = this.querySelector('.search-input');
        searchInput.addEventListener('input', () => {
            this.populateItems(searchInput.value);
        })
        const clearButton = this.querySelector('.clear-button');
        clearButton.addEventListener('click', () => {
            this.populateItems();
        })

        this.addItemButton.addEventListener('click', () => {
            const bottomSheet = document.querySelector('bottom-sheet');
            const itemAdd = new ItemAdd(searchInput.value);
            bottomSheet.addStep(itemAdd, "Add Item").then((step) => {
                bottomSheet.goToStep(step);
                itemAdd.addEventListener('add-submitted', (event) => {
                    bottomSheet.closeStep(step);
                    this.selectedItems.push(event.detail)
                    this.populateItems();
                })
            });
        })

        this.itemsDiv.addEventListener('click', (event) => {
            const itemPill = event.target.closest('item-pill');
            if (itemPill) {
                if (itemPill.classList.contains('selected')) {
                    itemPill.toggleSelected();
                    const index = this.selectedItems.indexOf(itemPill.item);
                    this.selectedItems.splice(index, 1);
                } else {
                    itemPill.toggleSelected();
                    this.selectedItems.push(itemPill.item);
                }
            }
        })
    }

    async populateItems(search=null) {
        this.addItemButton.classList.add('hidden');
        this.itemsDiv.replaceChildren(this.addItemButton);

        let filteredItems = getDefaultItemsSort(items).
            filter(item => !this.selectedItems.includes(item));
        filteredItems = [...getDefaultItemsSort(this.selectedItems), ...filteredItems];
        
        if (search) {
            this.addItemButton.classList.remove('hidden');
            const addItemText = this.addItemButton.querySelector('.add-text');
            addItemText.textContent = `New: ${search}`

            let searchWords = [];
            if (search.includes('"')) {
                const regex =/"([^"]*)"/g;
                searchWords = Array.from(search.matchAll(regex), m => m[1]);
                search = search.replaceAll('"', '')
                for (const searchWord of searchWords) {
                    search = search.replace(searchWord, '');
                }
            }
            if (search) searchWords = searchWords.concat(search.trim().split(" "));
            filteredItems = items.filter(item => {
                return searchWords.some(word => item.name.includes(word));
            })
        }

        for (const item of filteredItems) {
            const itemPill = new ItemPill(item, false, true);
            if (this.selectedItems.includes(item)) {
                itemPill.toggleSelected();
            }
            this.addItemButton.before(itemPill);
        }
    }

    disconnectedCallback() {
        const itemSelectedEvent = new CustomEvent('items-selected', {
            detail: this.selectedItems
        });
        this.dispatchEvent(itemSelectedEvent);
    }
}
customElements.define('item-select', ItemSelect);
