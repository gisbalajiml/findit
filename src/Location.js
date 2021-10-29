import { Data } from "./Data";
import { PathConfig } from "./PathConfig";
const getHierarchyLocation = () => {
    const url = PathConfig.API_PATH + '/getV6Locations';
    const params = {
      'sessionId': sessionStorage.sessionId
    }
    Data.get(url, params, (err, results) => {
      if(err){
        console.log('err-----------------',err)
      }else {
        sessionStorage.setItem('hierarchyLocation',JSON.stringify(results.data.result))
      }
    })
}

const getParentLocation = (store) => {
    const hierarchyLocation = JSON.parse(
      sessionStorage.getItem("hierarchyLocation")
    );
    var parentLocation = [];
    function getParent() {
      hierarchyLocation.hierarchy.forEach((loc) => {
        if (store === loc.id) {
          parentLocation.push(loc.id);
          store = loc.parent;
          getParent();
        }
      });
    }
    getParent();
    return parentLocation;
  };
  
  const getSiblingStore = (store) => {
    var siblingStore = {};
    const hierarchyLocation = JSON.parse(
      sessionStorage.getItem("hierarchyLocation")
    );
    hierarchyLocation.hierarchy.forEach((loc) => {
      if (store === loc.id) {
        getSibling(loc.parent);
      }
    });
    function getSibling(parentStore) {
      hierarchyLocation.hierarchy.forEach((loc) => {
        if (parentStore === loc.parent && store !== loc.id) {
          siblingStore[loc.id] = loc.name
        }
      });
    }
    return siblingStore;
  };
  
  const getChildStore = (store) => {
    var childStore = [];
    const hierarchyLocation = JSON.parse(
      sessionStorage.getItem("hierarchyLocation")
    );
    hierarchyLocation.hierarchy.forEach((loc) => {
      if (store === loc.parent) {
        if (loc.type === "Store") {
          if (!childStore.length) {
            var siblingStore = getSiblingStore(loc.id);
            siblingStore.push(loc.id);
            childStore = siblingStore;
          }
        } else {
            var siblingStore = getSiblingStore(loc.id);
            siblingStore.push(loc.id);
            getStore(siblingStore);
        }
      } else if (store === loc.id) {
        if (loc.type === "Store") {
          childStore.push(loc.id);
        }
      }
    });
      function getStore(parentStore) {
        hierarchyLocation.hierarchy.forEach((loc) => {
          if (parentStore === loc.parent && store !== loc.id) {
          }
        });
      }
    console.log("childStore-------------", childStore);
    debugger;
  };
  
  export var Location = {
    getParentLocation: getParentLocation,
    getSiblingStore: getSiblingStore,
    getChildStore: getChildStore,
    getHierarchyLocation: getHierarchyLocation
  };
  