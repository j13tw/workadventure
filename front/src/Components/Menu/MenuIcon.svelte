<script lang="typescript">
    import logoTalk from "../images/logo-message-pixel.png";
    import logoWA from "../images/logo-WA-pixel.png";
    import { menuVisiblilityStore } from "../../Stores/MenuStore";
    import { chatVisibilityStore } from "../../Stores/ChatStore";
    import { get } from "svelte/store";

    function showMenu() {
        menuVisiblilityStore.set(!get(menuVisiblilityStore));
    }

    function showChat() {
        chatVisibilityStore.set(true);
    }

    function noDrag() {
        return false;
    }
</script>

<svelte:window />

<main class="menuIcon noselect">
    <img
        src={logoWA}
        alt="open menu"
        class="nes-pointer"
        draggable="false"
        on:dragstart|preventDefault={noDrag}
        on:click|preventDefault={showMenu}
    />
    <img
        src={logoTalk}
        alt="open menu"
        class="nes-pointer"
        draggable="false"
        on:dragstart|preventDefault={noDrag}
        on:click|preventDefault={showChat}
    />
</main>

<style lang="scss">
    @import "../../../style/breakpoints.scss";
    .menuIcon {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 20%;
        z-index: 800;
        position: relative;

        img {
            pointer-events: auto;
            width: 60px;
            padding-top: 0;
            margin: 5%;
        }
    }
    .menuIcon img:hover {
        transform: scale(1.2);
    }
    @include media-breakpoint-up(sm) {
        .menuIcon {
            margin-top: 10%;
            img {
                pointer-events: auto;
                width: 60px;
                padding-top: 0;
            }
        }
        .menuIcon img:hover {
            transform: scale(1.2);
        }
    }

    @include media-breakpoint-up(md) {
        .menuIcon {
            img {
                width: 50px;
            }
        }
    }
</style>
