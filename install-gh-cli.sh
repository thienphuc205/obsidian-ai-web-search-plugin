#!/bin/bash

# 🛠️ GitHub CLI Installation Helper
# Automatically installs GitHub CLI if not present

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Detect OS and install GitHub CLI
install_github_cli() {
    print_status "Detecting operating system..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_status "macOS detected"
        
        if command -v brew &> /dev/null; then
            print_status "Installing GitHub CLI via Homebrew..."
            brew install gh
        else
            print_warning "Homebrew not found. Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install gh
        fi
        
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        print_status "Linux detected"
        
        if command -v apt-get &> /dev/null; then
            # Ubuntu/Debian
            print_status "Installing GitHub CLI via apt..."
            curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
            sudo apt update
            sudo apt install gh
            
        elif command -v yum &> /dev/null; then
            # RedHat/CentOS
            print_status "Installing GitHub CLI via yum..."
            sudo dnf install 'dnf-command(config-manager)'
            sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
            sudo dnf install gh
            
        else
            print_warning "Unsupported Linux distribution. Please install GitHub CLI manually:"
            echo "https://github.com/cli/cli#installation"
        fi
        
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        print_status "Windows detected"
        
        if command -v winget &> /dev/null; then
            print_status "Installing GitHub CLI via winget..."
            winget install --id GitHub.cli
        elif command -v choco &> /dev/null; then
            print_status "Installing GitHub CLI via Chocolatey..."
            choco install gh
        else
            print_warning "Please install GitHub CLI manually:"
            echo "https://github.com/cli/cli#installation"
        fi
        
    else
        print_warning "Unsupported operating system. Please install GitHub CLI manually:"
        echo "https://github.com/cli/cli#installation"
    fi
}

# Main function
main() {
    echo "🛠️ GitHub CLI Installation Helper"
    echo ""
    
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI is already installed!"
        gh --version
    else
        print_warning "GitHub CLI not found. Installing..."
        install_github_cli
        
        if command -v gh &> /dev/null; then
            print_success "GitHub CLI installed successfully!"
            gh --version
        else
            print_warning "Installation may have failed. Please check manually."
        fi
    fi
    
    echo ""
    print_status "To authenticate with GitHub, run:"
    echo "gh auth login"
}

main "$@"
