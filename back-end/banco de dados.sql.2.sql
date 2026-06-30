create database ItajubaSemFiltro;
use ItajubaSemFiltro;
 
create table usuario (
id_usuario int auto_increment primary key,
nome varchar(50) not null,
email varchar(100) not null,
senha varchar(100) not null
);
 
create table reclamacao (
id_reclamacao int auto_increment primary key,
id_usuario int,
nome varchar(100) not null,
reclam varchar(1000) not null,
data_envio date not null,
resolvida boolean default false,
foreign key(id_usuario) references usuario(id_usuario)
);
 
create table curtida (
id_curtida int auto_increment,
quantidade int default 0,
id_reclamacao int,
primary key(id_curtida,id_reclamacao),
foreign key(id_reclamacao) references reclamacao(id_reclamacao)
);
 
create table administrador (
id_admin int auto_increment primary key,
senha varchar(100) not null
);
 
create table codSenha (
id int primary key,
senha_cod varchar(10) not null
);
 
insert into codSenha values(1,"adm");