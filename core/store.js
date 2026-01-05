// core/store.js - Gestión centralizada de estado

class Store {
    constructor() {
        this.state = {
            allFacebaseItems: [],
            allFacebaseGroups: [],
            facebaseCategories: null,
            allAvatarItems: [],
            allTextureBasenames: [],
            allTextureItems: [],
            allTextureGroups: [],
            allMusicCodes: [],
            globalDataLoaded: false,
            initializedTabs: {
                facebases: false,
                music: false,
                timeConverter: false,
                avatar: false,
                textures: false,
                favorites: false
            }
        };

        this.subscribers = [];
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== callback);
        };
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.state));
    }
}

export const store = new Store();
export default store;
