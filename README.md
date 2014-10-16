## Backend

The backend must run in a privileged docker instance, that way it can build more images!

### Build base image

First you must manually build the backend!

```
docker build -t 'haskell-online-base' .
```


valid package names
[A-Za-z0-9\-] -- max length 50

valid versions
[0-9\.] -- max length 12


valid packages

curl https://hackage.haskell.org/packages/ -H "Accept: application/json"


valid versions

HTML https://hackage.haskell.org/package/DocTest


## Backend

type File = String
type Parent = Maybe String
type PostID = String
type Post = {
                files = [String],
                modules = [{name = String, version = Maybe String}]
            }
type FamilyTree = BinaryTree String

POST /execute :: Post -> Loading Stream -> Result
POST /post/create :: {post = Post, parent = Parent}
                  -> {id = PostID}
POST /post/get :: {id = PostID}
               -> {files = [File], family_tree = FamilyTree}