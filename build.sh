#!/bin/bash

# --- Input Validation ---
if [ "$#" -lt 2 ] || [ "$#" -gt 5 ]; then
    echo "Usage: $0 <IMAGE_NAME> <REGISTRY> [FINAL_TAG] [--latest] [--build-app]"
    echo "Example: $0 myorg/myapp my-registry.com"
    echo "         $0 myorg/myapp my-registry.com 1.0.0"
    echo "         $0 myorg/myapp my-registry.com 1.0.0 --latest"
    echo "         $0 myorg/myapp my-registry.com --build-app"
    echo "         $0 myorg/myapp my-registry.com 1.0.0 --latest --build-app"
    echo ""
    echo "If FINAL_TAG is omitted, version from package.json will be used."
    exit 1
fi

# --- Configuration Variables from CLI ---
IMAGE_NAME="$1"
REGISTRY="$2"
FINAL_TAG=""
TAG_LATEST=false
BUILD_APP=false

# Parse remaining arguments
shift 2
while [ "$#" -gt 0 ]; do
    case "$1" in
        --latest)
            TAG_LATEST=true
            shift
            ;;
        --build-app)
            BUILD_APP=true
            shift
            ;;
        *)
            # If it doesn't start with --, assume it's the FINAL_TAG
            if [[ "$1" != --* ]] && [ -z "$FINAL_TAG" ]; then
                FINAL_TAG="$1"
                shift
            else
                echo "Unknown option: $1"
                exit 1
            fi
            ;;
    esac
done

# --- Prerequisites Check ---
echo "--- Prerequisites Check 🔍 ---"

# Check if podman is available
echo -n "Checking for podman... "
if ! command -v podman &> /dev/null; then
    echo "❌"
    echo "Error: podman is not installed or not in PATH"
    echo "Please install Podman before running this script"
    echo ""
    echo "Install instructions:"
    echo "  - Ubuntu/Debian: sudo apt install podman"
    echo "  - RHEL/Fedora:   sudo dnf install podman"
    echo "  - macOS:         brew install podman"
    echo "  - Or visit:      https://podman.io/getting-started/installation"
    exit 1
fi
echo "✅"

# Check if npm is available (only if --build-app flag is set)
if [ "$BUILD_APP" = true ]; then
    printf "%-80s" "Checking for npm... "
    if ! command -v npm &> /dev/null; then
        echo "❌"
        echo "Error: npm is not installed or not in PATH"
        echo "Please install Node.js and npm before running with --build-app"
        echo ""
        echo "Install instructions:"
        echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
        echo "  - RHEL/Fedora:   sudo dnf install nodejs npm"
        echo "  - macOS:         brew install node"
        echo "  - Or visit:      https://nodejs.org/"
        exit 1
    fi
    echo "✅"
    
    # Check if package.json exists
    printf "%-80s" "Checking for package.json... "
    if [ ! -f "package.json" ]; then
        echo "❌"
        echo "Error: package.json not found in current directory"
        exit 1
    fi
    echo "✅"
fi

# Check if Dockerfile exists
printf "%-80s" "Checking for Dockerfile... "
if [ ! -f "Dockerfile" ]; then
    echo "❌"
    echo "Error: Dockerfile not found in current directory"
    exit 1
fi
echo "✅"

echo ""

# If FINAL_TAG is not provided, read from package.json
if [ -z "$FINAL_TAG" ]; then
    if [ ! -f "package.json" ]; then
        echo "❌ Error: package.json not found and no FINAL_TAG provided."
        exit 1
    fi
    
    # Extract version from package.json using grep and sed
    FINAL_TAG=$(grep -m 1 '"version"' package.json | sed 's/.*"version": "\(.*\)".*/\1/')
    
    if [ -z "$FINAL_TAG" ]; then
        echo "❌ Error: Could not extract version from package.json"
        exit 1
    fi
    
    echo "📦 Using version from package.json: ${FINAL_TAG}"
fi

# Derived tags for individual images
ARCH_TAG="${FINAL_TAG}"

# --- Fully Qualified Names (FQN) ---
# FQNs for the individual architectural images
AMD64_FQN="${REGISTRY}/${IMAGE_NAME}:amd64-${ARCH_TAG}"
ARM64_FQN="${REGISTRY}/${IMAGE_NAME}:arm64-${ARCH_TAG}"

# FQN for the final manifest list
MANIFEST_FQN="${REGISTRY}/${IMAGE_NAME}:${FINAL_TAG}"

# FQNs for "latest" tags
AMD64_LATEST_FQN="${REGISTRY}/${IMAGE_NAME}:amd64-latest"
ARM64_LATEST_FQN="${REGISTRY}/${IMAGE_NAME}:arm64-latest"
MANIFEST_LATEST_FQN="${REGISTRY}/${IMAGE_NAME}:latest"

echo "--- Configuration Summary ---"
echo "Image Name:    ${IMAGE_NAME}"
echo "Registry:      ${REGISTRY}"
echo "Final Tag:     ${FINAL_TAG}"
echo "Architecture:  ${ARCH_TAG}"
echo "Tag as Latest: ${TAG_LATEST}"
echo "Build App:     ${BUILD_APP}"
echo "-----------------------------"

# --- Script Logic ---

## 0. Building Application (if requested)

if [ "$BUILD_APP" = true ]; then
    echo "--- 0. Building Application 🏗️ ---"
    
    # Delete dist directory if it exists
    if [ -d "dist" ]; then
        printf "%-80s" "Removing 'dist' directory... "
        if rm -rf dist 2>/dev/null; then
            echo "✅"
        else
            echo "❌ Failed to remove dist directory"
            exit 1
        fi
    fi
    
    # Run npm build
    printf "%-80s" "Running 'npm run build'... "
    if npm run build > /tmp/neo-ui-framework-build.log 2>&1; then
        echo "✅"
    else
        echo "❌ npm build failed"
        echo "Error log:"
        tail -20 /tmp/neo-ui-framework-build.log
        exit 1
    fi
    echo ""
fi

## 1. Authenticating to Registry

echo "--- 1. Authenticating to Registry 🔑 ---"
printf "%-80s" "Checking authentication... "
if LOGGED_IN_USER=$(podman login --get-login "${REGISTRY}" 2>/dev/null); then
    echo "✅ (${LOGGED_IN_USER})"
else
    echo ""
    printf "%-80s" "Attempting login... "
    echo ""
    if podman login "${REGISTRY}"; then
        echo "✅"
    else
        echo "❌ Authentication failed"
        exit 1
    fi
fi
echo ""


## 2. Building Images

echo "--- 2. Building Architecture-Specific Images 🏗️ ---"

# Build AMD64 image locally
printf "%-80s" "Building AMD64 image... "
if podman build --platform linux/amd64 -t "${IMAGE_NAME}:amd64-local" . > /tmp/neo-ui-framework-build.log 2>&1; then
    echo "✅"
else
    echo "❌ AMD64 build failed"
    echo "Error log:"
    tail -20 /tmp/neo-ui-framework-build.log
    exit 1
fi

# Build ARM64 image locally
printf "%-80s" "Building ARM64 image... "
if podman build --platform linux/arm64 -t "${IMAGE_NAME}:arm64-local" . > /tmp/neo-ui-framework-build.log 2>&1; then
    echo "✅"
else
    echo "❌ ARM64 build failed"
    echo "Error log:"
    tail -20 /tmp/neo-ui-framework-build.log
    exit 1
fi
echo ""

## 3. Tagging and Pushing Images

echo "--- 3. Tagging and Pushing Images 📤 ---"

# Tag and Push AMD64
printf "%-80s" "Tagging AMD64... "
if podman tag "${IMAGE_NAME}:amd64-local" "${AMD64_FQN}" 2>/dev/null; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

printf "%-80s" "Pushing ${AMD64_FQN}... "
if podman push "${AMD64_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
    echo "✅"
else
    echo "❌ Push failed"
    tail -10 /tmp/neo-ui-framework-build.log
    exit 1
fi

# Tag and Push ARM64
printf "%-80s" "Tagging ARM64... "
if podman tag "${IMAGE_NAME}:arm64-local" "${ARM64_FQN}" 2>/dev/null; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

printf "%-80s" "Pushing ${ARM64_FQN}... "
if podman push "${ARM64_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
    echo "✅"
else
    echo "❌ Push failed"
    tail -10 /tmp/neo-ui-framework-build.log
    exit 1
fi
echo ""

# If --latest flag is set, also push with "latest" tags
if [ "$TAG_LATEST" = true ]; then
    echo "--- Tagging and Pushing as 'latest' 🏷️ ---"
    
    # Tag and Push AMD64 as latest
    printf "%-80s" "Tagging AMD64 as latest... "
    if podman tag "${IMAGE_NAME}:amd64-local" "${AMD64_LATEST_FQN}" 2>/dev/null; then
        echo "✅"
    else
        echo "❌"
        exit 1
    fi
    
    printf "%-80s" "Pushing ${AMD64_LATEST_FQN}... "
    if podman push "${AMD64_LATEST_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
        echo "✅"
    else
        echo "❌ Push failed"
        tail -10 /tmp/neo-ui-framework-build.log
        exit 1
    fi
    
    # Tag and Push ARM64 as latest
    printf "%-80s" "Tagging ARM64 as latest... "
    if podman tag "${IMAGE_NAME}:arm64-local" "${ARM64_LATEST_FQN}" 2>/dev/null; then
        echo "✅"
    else
        echo "❌"
        exit 1
    fi
    
    printf "%-80s" "Pushing ${ARM64_LATEST_FQN}... "
    if podman push "${ARM64_LATEST_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
        echo "✅"
    else
        echo "❌ Push failed"
        tail -10 /tmp/neo-ui-framework-build.log
        exit 1
    fi
fi
echo ""

## 4. Creating and Pushing Manifest List

echo "--- 4. Creating and Pushing Manifest List 📝 ---"

# Remove existing manifest if it exists
if podman manifest exists "${MANIFEST_FQN}" 2>/dev/null; then
    printf "%-80s" "Removing existing manifest... "
    if podman manifest rm "${MANIFEST_FQN}" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "⚠️  (continuing)"
    fi
fi

printf "%-80s" "Creating manifest ${MANIFEST_FQN}... "
if podman manifest create "${MANIFEST_FQN}" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌ Manifest creation failed"
    exit 1
fi

printf "%-80s" "Adding AMD64 to manifest... "
if podman manifest add "${MANIFEST_FQN}" "docker://${AMD64_FQN}" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

printf "%-80s" "Adding ARM64 to manifest... "
if podman manifest add "${MANIFEST_FQN}" "docker://${ARM64_FQN}" > /dev/null 2>&1; then
    echo "✅"
else
    echo "❌"
    exit 1
fi

printf "%-80s" "Pushing manifest ${MANIFEST_FQN}... "
if podman manifest push "${MANIFEST_FQN}" "docker://${MANIFEST_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
    echo "✅"
else
    echo "❌ Manifest push failed"
    tail -10 /tmp/neo-ui-framework-build.log
    exit 1
fi
echo ""

## 5. Creating and Pushing "latest" Manifest (if requested)
if [ "$TAG_LATEST" = true ]; then
    echo "--- 5. Creating and Pushing 'latest' Manifest 📝 ---"

    # Remove existing latest manifest if it exists
    if podman manifest exists "${MANIFEST_LATEST_FQN}" 2>/dev/null; then
        printf "%-80s" "Removing existing latest manifest... "
        if podman manifest rm "${MANIFEST_LATEST_FQN}" > /dev/null 2>&1; then
            echo "✅"
        else
            echo "⚠️  (continuing)"
        fi
    fi
    
    # Also check for any image with the same name
    if podman image exists "${MANIFEST_LATEST_FQN}" 2>/dev/null; then
        printf "%-80s" "Removing existing latest image... "
        if podman rmi "${MANIFEST_LATEST_FQN}" > /dev/null 2>&1; then
            echo "✅"
        else
            echo "⚠️  (continuing)"
        fi
    fi
    
    printf "%-80s" "Creating latest manifest... "
    if podman manifest create "${MANIFEST_LATEST_FQN}" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌ Latest manifest creation failed"
        exit 1
    fi
    
    printf "%-80s" "Adding AMD64 to latest manifest... "
    if podman manifest add "${MANIFEST_LATEST_FQN}" "docker://${AMD64_LATEST_FQN}" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
        exit 1
    fi
    
    printf "%-80s" "Adding ARM64 to latest manifest... "
    if podman manifest add "${MANIFEST_LATEST_FQN}" "docker://${ARM64_LATEST_FQN}" > /dev/null 2>&1; then
        echo "✅"
    else
        echo "❌"
        exit 1
    fi
    
    printf "%-80s" "Pushing latest manifest... "
    if podman manifest push "${MANIFEST_LATEST_FQN}" "docker://${MANIFEST_LATEST_FQN}" > /tmp/neo-ui-framework-build.log 2>&1; then
        echo "✅"
    else
        echo "❌ Latest manifest push failed"
        tail -10 /tmp/neo-ui-framework-build.log
        exit 1
    fi
    echo ""
fi
echo "-----------------------------"
echo "✨ Multi-arch build and push complete! ✨"
echo "Manifest: ${MANIFEST_FQN}"
echo "Consumers can pull: ${MANIFEST_FQN}"
echo "-----------------------------"
if [ "$TAG_LATEST" = true ]; then
    echo "Latest Manifest: ${MANIFEST_LATEST_FQN}"
    echo "Consumers can also pull: ${MANIFEST_LATEST_FQN}"
fi
echo "-----------------------------"
# Cleanup temporary log file
printf "%-80s" "Cleaning up temporary log file... "
rm -f /tmp/neo-ui-framework-build.log
echo "✅"