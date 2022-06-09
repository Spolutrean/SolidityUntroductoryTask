# Тестовое задание на курс от Crypton Academy

Выполнил тестовое задание, чтобы попасть на курс от Crypton Academy, ниже полный текст задания

![задание](https://user-images.githubusercontent.com/28225965/172812782-c69ebfac-0a39-40a3-8eaf-1bcd94c801c2.png)

![картинка к нему](https://user-images.githubusercontent.com/28225965/172811639-bc171b0d-4cae-4d3d-911d-954ab3c6c404.png)

## TL;DR ## 
Нужно написать смарт контракт для голосований, полностью покрыть его тестами, опубликовать в Rinkeby, написать скрипты для взаимодействия с опубликованным контрактом.

## Что было сделано ##
* Написан смарт контракт для голосований [Ballot.sol](contracts/Ballot.sol)
* Созданы 54 [теста](test/)
  + Они обеспечивают 100% покрытие кода ![изображение](https://user-images.githubusercontent.com/28225965/172815272-dfbae456-7f7e-4759-8d4e-bc3cda8df6fc.png)
* Создан [скрипт](scripts/deploy.js) для публикации контракта в тестовую сеть `Rinkeby`. [Опубликованный контракт](https://rinkeby.etherscan.io/address/0xE9636AC7F89aeC7B6F8402E9aBF911A427F60E07)
* Созданы [hardhat-task'и](tasks/) для взаимодействия с обубликованным контрактом
* Приватные ключи от `Alchemy` и `Ethereum` аккаунта вынесены в `.env` файл 
